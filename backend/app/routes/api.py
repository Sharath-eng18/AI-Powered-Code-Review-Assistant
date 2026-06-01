from flask import Blueprint, jsonify, request
from sqlalchemy import func
from app.database import db
from app.models import Repository, PullRequest, Review, ReviewComment

api_bp = Blueprint('api', __name__)

@api_bp.route("/stats", methods=["GET"])
def get_stats():
    """Retrieve aggregate stats for the dashboard."""
    try:
        # Total counts
        total_repos = Repository.query.count()
        total_prs = PullRequest.query.count()
        total_reviews = Review.query.count()
        
        # Success vs Failed reviews
        success_reviews = Review.query.filter_by(status="SUCCESS").count()
        failed_reviews = Review.query.filter_by(status="FAILED").count()
        
        # Average processing duration (only for successful runs)
        avg_duration_row = db.session.query(func.avg(Review.duration_seconds)).filter(Review.status == "SUCCESS").first()
        avg_duration = round(float(avg_duration_row[0]), 2) if avg_duration_row and avg_duration_row[0] is not None else 0.0

        # Severity breakdown of findings
        severity_counts = db.session.query(
            ReviewComment.severity, func.count(ReviewComment.id)
        ).group_by(ReviewComment.severity).all()
        
        severity_map = {severity: count for severity, count in severity_counts}
        
        # Average issues per review
        avg_issues_row = db.session.query(func.avg(Review.total_issues)).filter(Review.status == "SUCCESS").first()
        avg_issues = round(float(avg_issues_row[0]), 1) if avg_issues_row and avg_issues_row[0] is not None else 0.0

        # Recent repositories activity
        active_repos = db.session.query(
            Repository.owner, Repository.name, func.count(PullRequest.id)
        ).join(PullRequest).group_by(Repository.id).limit(5).all()

        repos_activity = [
            {"repo": f"{owner}/{name}", "pr_count": count}
            for owner, name, count in active_repos
        ]

        return jsonify({
            "total_repos": total_repos,
            "total_prs": total_prs,
            "total_reviews": total_reviews,
            "success_rate": round((success_reviews / total_reviews * 100), 1) if total_reviews > 0 else 100.0,
            "avg_duration_seconds": avg_duration,
            "avg_issues_per_review": avg_issues,
            "severity_distribution": {
                "error": severity_map.get("error", 0),
                "warning": severity_map.get("warning", 0),
                "info": severity_map.get("info", 0)
            },
            "active_repos": repos_activity
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_bp.route("/reviews", methods=["GET"])
def get_reviews():
    """Retrieve all review logs, sorted by creation date (newest first)."""
    try:
        # Get query parameters
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 10, type=int)
        status_filter = request.args.get("status", None)
        repo_filter = request.args.get("repo", None)

        query = db.session.query(
            Review.id.label("review_id"),
            Review.status,
            Review.total_issues,
            Review.created_at,
            PullRequest.pr_number,
            PullRequest.title.label("pr_title"),
            PullRequest.author.label("pr_author"),
            Repository.owner.label("repo_owner"),
            Repository.name.label("repo_name")
        ).join(
            PullRequest, Review.pr_id == PullRequest.id
        ).join(
            Repository, PullRequest.repository_id == Repository.id
        )

        if status_filter:
            query = query.filter(Review.status == status_filter)
        if repo_filter:
            # Matches 'owner/name'
            if "/" in repo_filter:
                owner, name = repo_filter.split("/", 1)
                query = query.filter(Repository.owner == owner, Repository.name == name)
            else:
                query = query.filter(Repository.name.like(f"%{repo_filter}%"))

        # Order by newest
        query = query.order_by(Review.created_at.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        reviews_list = []
        for row in pagination.items:
            reviews_list.append({
                "id": row.review_id,
                "status": row.status,
                "total_issues": row.total_issues,
                "created_at": row.created_at.isoformat(),
                "pr_number": row.pr_number,
                "pr_title": row.pr_title,
                "pr_author": row.pr_author,
                "repo": f"{row.repo_owner}/{row.repo_name}"
            })

        return jsonify({
            "reviews": reviews_list,
            "page": page,
            "pages": pagination.pages,
            "total": pagination.total
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_bp.route("/reviews/<int:review_id>", methods=["GET"])
def get_review_details(review_id):
    """Retrieve detailed info for a single code review."""
    try:
        review = Review.query.get(review_id)
        if not review:
            return jsonify({"error": "Review log not found"}), 404

        pr = PullRequest.query.get(review.pr_id)
        repo = Repository.query.get(pr.repository_id)

        comments = [comment.to_dict() for comment in review.comments]

        return jsonify({
            "id": review.id,
            "status": review.status,
            "summary_feedback": review.summary_feedback,
            "raw_diff": review.raw_diff,
            "duration_seconds": review.duration_seconds,
            "total_issues": review.total_issues,
            "error_message": review.error_message,
            "created_at": review.created_at.isoformat(),
            "pr": {
                "pr_number": pr.pr_number,
                "title": pr.title,
                "author": pr.author,
                "state": pr.state
            },
            "repo": {
                "owner": repo.owner,
                "name": repo.name,
                "full_name": f"{repo.owner}/{repo.name}"
            },
            "comments": comments
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
