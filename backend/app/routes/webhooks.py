import time
import threading
import re
from flask import Blueprint, request, jsonify, current_app
from app.database import db
from app.models import Repository, PullRequest, Review, ReviewComment
from app.services.github_service import GitHubService
from app.services.ai_service import AIService

webhooks_bp = Blueprint('webhooks', __name__)

def parse_diff_valid_lines(diff_content):
    valid_lines = {}
    if not diff_content:
        return valid_lines
        
    current_file = None
    lines = diff_content.split('\n')
    for line in lines:
        if line.startswith('+++ b/'):
            current_file = line[6:].strip()
            valid_lines[current_file] = set()
        elif line.startswith('@@ '):
            if current_file:
                hunk_match = re.match(r'^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@', line)
                if hunk_match:
                    start_line = int(hunk_match.group(1))
                    count = int(hunk_match.group(2)) if hunk_match.group(2) else 1
                    for l in range(start_line, start_line + count):
                        valid_lines[current_file].add(l)
    return valid_lines

def find_matching_file(ai_path, valid_files):
    if not ai_path:
        return None
    ai_path_norm = ai_path.replace('\\', '/').strip().lstrip('/')
    
    if ai_path_norm in valid_files:
        return ai_path_norm
        
    suffix_matches = [f for f in valid_files if f.endswith('/' + ai_path_norm) or f == ai_path_norm]
    if len(suffix_matches) == 1:
        return suffix_matches[0]
        
    prefix_matches = [f for f in valid_files if ai_path_norm.endswith('/' + f) or ai_path_norm == f]
    if len(prefix_matches) == 1:
        return prefix_matches[0]
        
    return None

def process_pr_review_async(app_context, payload):
    """Background task to fetch diff, run AI review, save to DB, and comment on GitHub."""
    with app_context:
        start_time = time.time()
        
        installation_id = payload.get("installation", {}).get("id")
        pr_data = payload.get("pull_request", {})
        pr_number = pr_data.get("number")
        pr_title = pr_data.get("title")
        pr_body = pr_data.get("body", "")
        pr_author = pr_data.get("user", {}).get("login")
        pr_state = pr_data.get("state", "open")
        
        repo_data = payload.get("repository", {})
        repo_name = repo_data.get("name")
        repo_owner = repo_data.get("owner", {}).get("login")
        
        if not all([installation_id, pr_number, repo_name, repo_owner]):
            current_app.logger.error("Missing webhook parameters, skipping review.")
            return

        # 1. Ensure Repository and PR exist in DB
        repo = Repository.query.filter_by(owner=repo_owner, name=repo_name).first()
        if not repo:
            repo = Repository(owner=repo_owner, name=repo_name)
            db.session.add(repo)
            db.session.commit()

        pr = PullRequest.query.filter_by(repository_id=repo.id, pr_number=pr_number).first()
        if not pr:
            pr = PullRequest(repository_id=repo.id, pr_number=pr_number, title=pr_title, author=pr_author, state=pr_state)
            db.session.add(pr)
        else:
            pr.title = pr_title
            pr.state = pr_state
        db.session.commit()

        # Create review log in PENDING status
        review_record = Review(
            pr_id=pr.id,
            status="PENDING",
            raw_diff="",
            total_issues=0
        )
        db.session.add(review_record)
        db.session.commit()

        try:
            # 2. Fetch diff
            diff_content = GitHubService.get_pr_diff(repo_owner, repo_name, pr_number, installation_id)
            review_record.raw_diff = diff_content
            db.session.commit()

            # Parse diff for valid paths and line numbers
            valid_lines_map = parse_diff_valid_lines(diff_content)

            # 3. Call AI Service to get Markdown response and parsed issues list
            ai_response = AIService.generate_review(pr_title, pr_body, diff_content)
            
            markdown_content = ai_response.get("markdown", "No summary provided.")
            issues = ai_response.get("issues", [])
            
            review_record.summary_feedback = markdown_content
            review_record.total_issues = len(issues)
            review_record.status = "SUCCESS"

            # 4. Save individual comments to DB and format for inline posting
            github_comments = []
            for issue in issues:
                file_path = issue.get("file_path")
                line_number = issue.get("line_number")
                
                comment_rec = ReviewComment(
                    review_id=review_record.id,
                    file_path=file_path,
                    line_number=line_number,
                    comment=issue.get("comment"),
                    severity=issue.get("severity", "info")
                )
                db.session.add(comment_rec)
                
                # Resolve and map the file path and line number to the actual diff
                matched_file = find_matching_file(file_path, valid_lines_map.keys())
                if matched_file:
                    valid_lines = valid_lines_map[matched_file]
                    if valid_lines:
                        raw_line = int(line_number) if line_number else 1
                        resolved_line = min(valid_lines, key=lambda x: abs(x - raw_line))
                        
                        github_comments.append({
                            "path": matched_file,
                            "line": resolved_line,
                            "side": "RIGHT",
                            "body": f"**[AI {issue.get('severity', 'info').upper()}]**: {issue.get('comment')}"
                        })
                    else:
                        current_app.logger.warning(f"File {matched_file} exists in diff but has no valid lines.")
                else:
                    current_app.logger.warning(f"File {file_path} from AI issues not found in PR diff files: {list(valid_lines_map.keys())}")
            
            db.session.commit()

            # 5. Post review Markdown back to GitHub
            # Try to post inline comments as well. If it fails, fallback to posting the Markdown review only.
            try:
                GitHubService.post_pr_review(
                    repo_owner, repo_name, pr_number, installation_id, 
                    body=markdown_content, event="COMMENT", comments=github_comments if github_comments else None
                )
            except Exception as github_err:
                current_app.logger.warning(f"Could not post inline reviews. Posting markdown summary review instead. Error: {str(github_err)}")
                # Fallback: Post review with markdown summary only
                GitHubService.post_pr_review(
                    repo_owner, repo_name, pr_number, installation_id, 
                    body=markdown_content, event="COMMENT"
                )

        except Exception as e:
            current_app.logger.error(f"Error processing pull request review: {str(e)}")
            review_record.status = "FAILED"
            review_record.error_message = str(e)
            db.session.commit()

        # Log total execution time
        duration = time.time() - start_time
        review_record.duration_seconds = round(duration, 2)
        db.session.commit()


@webhooks_bp.route("/webhook", methods=["POST"])
def github_webhook():
    """Receives webhook events from GitHub."""
    signature = request.headers.get("X-Hub-Signature-256")
    
    # Verify signature
    if not GitHubService.verify_webhook_signature(request.data, signature):
        return jsonify({"error": "Invalid webhook signature"}), 401
    
    event_type = request.headers.get("X-GitHub-Event")
    payload = request.json
    
    if event_type == "pull_request":
        action = payload.get("action")
        # Review when pull request is opened, synchronized (new commits pushed), or reopened
        if action in ["opened", "synchronize", "reopened"]:
            # Start background thread to review without blocking GitHub webhook response
            app_context = current_app._get_current_object().app_context()
            thread = threading.Thread(target=process_pr_review_async, args=(app_context, payload))
            thread.start()
            return jsonify({"status": "processing"}), 202
            
        return jsonify({"status": f"ignored_action_{action}"}), 200

    return jsonify({"status": "ignored_event"}), 200
