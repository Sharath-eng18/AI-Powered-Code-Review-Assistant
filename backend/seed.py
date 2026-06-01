from app import create_app
from app.database import db
from app.models import Repository, PullRequest, Review, ReviewComment
from datetime import datetime, timedelta

app = create_app()

def seed_data():
    with app.app_context():
        # Clear existing data if any
        db.drop_all()
        db.create_all()

        print("Seeding database with sample PR review logs...")

        # 1. Create Sample Repositories
        repo1 = Repository(owner="octocat", name="hello-world", created_at=datetime.utcnow() - timedelta(days=10))
        repo2 = Repository(owner="deepmind", name="alpha-code", created_at=datetime.utcnow() - timedelta(days=5))
        db.session.add_all([repo1, repo2])
        db.session.commit()

        # 2. Create Sample Pull Requests
        pr1 = PullRequest(
            repository_id=repo1.id,
            pr_number=42,
            title="Refactor auth middleware and fix token parsing bugs",
            author="defunkt",
            state="open",
            created_at=datetime.utcnow() - timedelta(days=2)
        )
        pr2 = PullRequest(
            repository_id=repo1.id,
            pr_number=43,
            title="Add analytics tracking event dispatcher",
            author="ezmobius",
            state="merged",
            created_at=datetime.utcnow() - timedelta(days=1)
        )
        pr3 = PullRequest(
            repository_id=repo2.id,
            pr_number=101,
            title="Optimize matrix multiplication kernel with AVX instructions",
            author="octocat",
            state="open",
            created_at=datetime.utcnow() - timedelta(hours=12)
        )
        db.session.add_all([pr1, pr2, pr3])
        db.session.commit()

        # 3. Create Sample Reviews & Comments
        # Review for PR 1 (Success with warnings and errors)
        review1 = Review(
            pr_id=pr1.id,
            status="SUCCESS",
            duration_seconds=4.82,
            total_issues=3,
            summary_feedback=(
                "### AI Code Review Summary\n\n"
                "The core changes represent a good improvement to authentication security by migrating to standard OAuth libraries. "
                "However, there are a few critical problems regarding resource disposal and signature validation that must be addressed "
                "before merging this branch.\n\n"
                "**Key Recommendations:**\n"
                "- Verify signature validation uses constant-time comparison algorithms.\n"
                "- Clean up token database cursor connection objects in error handling blocks.\n"
                "- Replace debug prints with contextual application logging statements."
            ),
            raw_diff=(
                "diff --git a/auth/middleware.py b/auth/middleware.py\n"
                "index e69de29..b2011b9 100644\n"
                "--- a/auth/middleware.py\n"
                "+++ b/auth/middleware.py\n"
                "@@ -10,12 +10,18 @@\n"
                " def check_auth_token(token):\n"
                "-    if token == \"master-secret-key\":\n"
                "-        return True\n"
                "+    # Parse token from headers\n"
                "+    try:\n"
                "+        db_conn = db.get_cursor()\n"
                "+        record = db_conn.execute(\"SELECT * FROM users WHERE token = ?\", (token,)).fetchone()\n"
                "+        print(f\"User token authenticated successfully: {record}\")\n"
                "+        return record is not None\n"
                "+    except Exception as e:\n"
                "+        print(f\"Database failure: {e}\")\n"
                "+        return False\n"
            ),
            created_at=datetime.utcnow() - timedelta(days=1)
        )
        db.session.add(review1)
        db.session.commit()

        # Comments for Review 1
        c1 = ReviewComment(
            review_id=review1.id,
            file_path="auth/middleware.py",
            line_number=14,
            comment="Avoid using debug print() statements. Use a configured logging client like app.logger.info() to preserve server contexts.",
            severity="info"
        )
        c2 = ReviewComment(
            review_id=review1.id,
            file_path="auth/middleware.py",
            line_number=17,
            comment="Possible database connection leak. If execute() throws an exception, the connection cursor db_conn is never closed. Wrap database executions in a context block or try-finally release.",
            severity="error"
        )
        c3 = ReviewComment(
            review_id=review1.id,
            file_path="auth/middleware.py",
            line_number=12,
            comment="Sensitive user tokens should be stored and queried as SHA-256 hashes instead of plain string matching, protecting against SQL inspection vectors.",
            severity="warning"
        )
        db.session.add_all([c1, c2, c3])

        # Review for PR 2 (Clean/Success)
        review2 = Review(
            pr_id=pr2.id,
            status="SUCCESS",
            duration_seconds=2.15,
            total_issues=0,
            summary_feedback=(
                "### AI Code Review Summary\n\n"
                "LGTM! The code is clean, documentation was updated, and proper unit test assertions were implemented. No structural code issues detected."
            ),
            raw_diff=(
                "diff --git a/analytics.py b/analytics.py\n"
                "index a1b2c3d..e5f6g7h 100644\n"
                "--- a/analytics.py\n"
                "+++ b/analytics.py\n"
                "@@ -1,5 +1,9 @@\n"
                "+import logging\n"
                "+\n"
                " def track_event(event_name, properties=None):\n"
                "+    logging.info(f\"Tracking analytics event: {event_name}\")\n"
                "     pass\n"
            ),
            created_at=datetime.utcnow() - timedelta(hours=18)
        )
        db.session.add(review2)

        # Review for PR 3 (Failed review log demo)
        review3 = Review(
            pr_id=pr3.id,
            status="FAILED",
            duration_seconds=12.4,
            total_issues=0,
            error_message="Hugging Face Inference API timed out after 10.0 seconds. High load or model loading cold start.",
            raw_diff=(
                "diff --git a/math/matrix.py b/math/matrix.py\n"
                "index 99a88b7..1234abc 100644\n"
                "--- a/math/matrix.py\n"
                "+++ b/math/matrix.py\n"
                "@@ -45,3 +45,15 @@\n"
                "+#pragma vector always\n"
                "+def fast_multiply_kernel(matrix_a, matrix_b):\n"
                "+    # AVX vector operations\n"
            ),
            created_at=datetime.utcnow() - timedelta(hours=2)
        )
        db.session.add(review3)
        db.session.commit()

        print("Database seeded successfully with dummy metrics!")

if __name__ == "__main__":
    seed_data()
