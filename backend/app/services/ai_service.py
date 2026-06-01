import re
import requests
from config import Config

class AIService:
    @staticmethod
    def scrub_secrets(text):
        """Scrub credentials, API keys, and passwords from text content using regex."""
        if not text:
            return text
        
        # 1. GitHub Tokens
        text = re.sub(r"ghp_[a-zA-Z0-9]{36}", "[REDACTED_GITHUB_TOKEN]", text)
        text = re.sub(r"github_pat_[a-zA-Z0-9]+", "[REDACTED_GITHUB_PAT]", text)
        
        # 2. Hugging Face Tokens
        text = re.sub(r"hf_[a-zA-Z0-9]{34}", "[REDACTED_HF_TOKEN]", text)
        
        # 3. Generic Secret Keys, Tokens, and Passwords in assignments or JSON
        # e.g., API_KEY = "mysecret", "password": "123"
        generic_pattern = r"(?i)(api[-_]?key|secret|password|passwd|private[-_]?key|auth[-_]?token)\s*([:=])\s*['\"]([^'\"]{4,})['\"]"
        
        def redact_match(match):
            key_name = match.group(1)
            operator = match.group(2)
            return f'{key_name} {operator} "[REDACTED_SECRET]"'
            
        text = re.sub(generic_pattern, redact_match, text)
        return text

    @staticmethod
    def generate_review(pr_title, pr_description, diff_content):
        """Generate a strict markdown code review from Hugging Face Inference API."""
        api_token = Config.HF_API_TOKEN
        model = Config.HF_MODEL

        # Security Layer: Scrub secrets before sending payload to Hugging Face
        diff_content = AIService.scrub_secrets(diff_content)
        pr_description = AIService.scrub_secrets(pr_description)

        if not api_token:
            # Fallback mock markdown response for testing when no token is provided
            return AIService._get_mock_review(pr_title)

        headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }

        # Prompt construction
        system_instruction = (
            "You are an expert senior staff engineer. Review the following code diff for potential bugs, security issues, performance problems, and styling flaws.\n"
            "Generate a structured, professional markdown code review report. Be strict, technical, and precise.\n"
            "Format your findings as follows:\n\n"
            "### AI Code Review Summary\n"
            "[Provide a high-level summary of the changes and overall quality here]\n\n"
            "### Critical Issues\n"
            "[Detail any critical bugs or security flaws here]\n\n"
            "### Detailed Findings\n"
            "You MUST list individual issues using this exact format so they can be parsed programmatically:\n"
            "- **[severity] file_path:line_number**: critique and suggested code fix\n\n"
            "Valid severities are: [error], [warning], [info].\n"
            "Example:\n"
            "- **[error] auth/middleware.py:17**: Possible database connection leak. Wrap database execution in a try-finally block.\n"
            "- **[warning] config.py:12**: Secret key should not be hardcoded. Use environment variables.\n"
            "Ensure the file paths match exactly the files in the diff. If line numbers are not clear, omit them or write 1."
        )

        user_content = f"PR Title: {pr_title}\nPR Description: {pr_description}\n\nCode Diff:\n{diff_content}"

        url = "https://router.huggingface.co/v1/chat/completions"
        
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_content}
            ],
            "temperature": 0.1,
            "max_tokens": 1500
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            
            # If the v1/chat/completions is not supported or returns 404, fallback to direct model API
            if response.status_code == 404 or response.status_code == 405:
                direct_url = f"https://router.huggingface.co/models/{model}"
                fallback_prompt = f"<|im_start|>system\n{system_instruction}<|im_end|>\n<|im_start|>user\n{user_content}<|im_end|>\n<|im_start|>assistant\n"
                
                direct_payload = {
                    "inputs": fallback_prompt,
                    "parameters": {
                        "max_new_tokens": 1500,
                        "temperature": 0.1,
                        "return_full_text": False
                    }
                }
                response = requests.post(direct_url, headers=headers, json=direct_payload, timeout=60)
                response.raise_for_status()
                response_json = response.json()
                
                if isinstance(response_json, list) and len(response_json) > 0:
                    markdown_out = response_json[0].get("generated_text", "")
                else:
                    markdown_out = str(response_json)
            else:
                response.raise_for_status()
                markdown_out = response.json()["choices"][0]["message"]["content"]

            return AIService._parse_markdown_response(markdown_out)

        except Exception as e:
            return {
                "markdown": f"### Review Failed\n\nUnable to generate AI review comments: {str(e)}",
                "issues": []
            }

    @staticmethod
    def _parse_markdown_response(markdown_content):
        """Clean markdown response and parse individual issues list."""
        clean_md = markdown_content.strip()
        clean_md = re.sub(r"^(Sure, here is my review:|Here is the code review report:|Here is my review of the changes:)\s*", "", clean_md, flags=re.IGNORECASE)

        issues = []
        pattern = r"^-\s*\*\*\s*\[(error|warning|info)\]\s*([^:]+):(\d+)\s*\*\*\s*:\s*(.*)$"
        
        for line in clean_md.split('\n'):
            match = re.match(pattern, line.strip(), re.IGNORECASE)
            if match:
                severity = match.group(1).lower()
                file_path = match.group(2).strip()
                line_number = int(match.group(3))
                comment = match.group(4).strip()
                issues.append({
                    "file_path": file_path,
                    "line_number": line_number,
                    "severity": severity,
                    "comment": comment
                })

        return {
            "markdown": clean_md,
            "issues": issues
        }

    @staticmethod
    def _get_mock_review(pr_title):
        """Returns a high-quality mock markdown review when HF API Key is missing."""
        mock_md = (
            f"### AI Code Review Summary\n\n"
            f"Reviewing Pull Request: **{pr_title}**\n\n"
            "Overall, the structural changes look solid. I have identified a few minor areas of improvement "
            "regarding error handling and variable scope. Check the inline findings below for details.\n\n"
            "### Detailed Findings\n"
            "- **[warning] backend/app/routes/api.py:25**: Potential database cursor leak if exception occurs. Use a context manager `with db.session.begin():` instead of manual commits.\n"
            "- **[info] backend/config.py:12**: Consider changing default secret key to load from environment variable strictly, throwing error if not present in production."
        )
        return AIService._parse_markdown_response(mock_md)
