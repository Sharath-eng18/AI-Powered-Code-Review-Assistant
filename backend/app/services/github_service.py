import hmac
import hashlib
import time
# pyrefly: ignore [missing-import]
import jwt
import requests
from config import Config

class GitHubService:
    @staticmethod
    def verify_webhook_signature(payload_body, signature_header):
        """Verify that the webhook signature matches our secret."""
        webhook_secret = Config.GITHUB_WEBHOOK_SECRET
        if not webhook_secret:
            # If no secret is configured, skip verification for local testing
            return True
        if not signature_header:
            return False

        # GitHub uses sha256 signature prefixed with 'sha256='
        sha_name, signature = signature_header.split('=')
        if sha_name != 'sha256':
            return False

        mac = hmac.new(webhook_secret.encode('utf-8'), msg=payload_body, digestmod=hashlib.sha256)
        return hmac.compare_digest(mac.hexdigest(), signature)

    @staticmethod
    def _generate_app_jwt():
        """Generate a JSON Web Token (JWT) to authenticate as the GitHub App."""
        app_id = Config.GITHUB_APP_ID
        private_key = Config.get_private_key()

        if not app_id or not private_key:
            raise ValueError("GITHUB_APP_ID and GITHUB_PRIVATE_KEY must be configured to authenticate as GitHub App")

        now = int(time.time())
        payload = {
            # Issued at time
            "iat": now - 60,
            # JWT expiration time (10 minute maximum)
            "exp": now + (10 * 60) - 60,
            # GitHub App's identifier
            "iss": str(app_id)
        }

        # Sign the JWT using the private key
        try:
            return jwt.encode(payload, private_key, algorithm="RS256")
        except Exception as e:
            # If pyjwt expects key as bytes or string
            return jwt.encode(payload, private_key.encode('utf-8') if isinstance(private_key, str) else private_key, algorithm="RS256")

    @staticmethod
    def get_installation_access_token(installation_id):
        """Exchange the App JWT for an installation access token."""
        jwt_token = GitHubService._generate_app_jwt()
        headers = {
            "Authorization": f"Bearer {jwt_token}",
            "Accept": "application/vnd.github+json"
        }
        url = f"https://api.github.com/app/installations/{installation_id}/access_tokens"
        response = requests.post(url, headers=headers)
        response.raise_for_status()
        return response.json()["token"]

    @staticmethod
    def get_pr_diff(owner, repo, pr_number, installation_id):
        """Fetch the raw diff representation of a Pull Request."""
        if not Config.GITHUB_APP_ID:
            # Local demo fallback when no GitHub App is registered
            return (
                "diff --git a/src/index.js b/src/index.js\n"
                "index 12345..67890 100644\n"
                "--- a/src/index.js\n"
                "+++ b/src/index.js\n"
                "@@ -1,5 +1,6 @@\n"
                " function getElement(arr, idx) {\n"
                "+    if (idx < 0 || idx >= arr.length) return null;\n"
                "     return arr[idx];\n"
                " }\n"
            )
        token = GitHubService.get_installation_access_token(installation_id)
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.diff"
        }
        url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}"
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.text

    @staticmethod
    def post_pr_review(owner, repo, pr_number, installation_id, body, event="COMMENT", comments=None):
        """Post a review summary and optional inline comments on a Pull Request.
        
        comments parameter schema:
        [
            {
                "path": "file_path",
                "line": line_number,
                "side": "RIGHT",
                "body": "comment text"
            }
        ]
        """
        if not Config.GITHUB_APP_ID:
            # Local demo fallback when no GitHub App is registered
            print(f"Mock Posted PR review on GitHub PR #{pr_number}. Body:\n{body}")
            return {"status": "mock_posted"}
        token = GitHubService.get_installation_access_token(installation_id)
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json"
        }
        url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/reviews"
        
        payload = {
            "body": body,
            "event": event
        }
        
        if comments:
            payload["comments"] = comments

        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()
