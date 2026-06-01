import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # Flask settings
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-12345")
    FLASK_ENV = os.environ.get("FLASK_ENV", "development")
    PORT = int(os.environ.get("PORT", 5000))

    # Database settings
    # Default to a local SQLite database in the backend folder
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///code_reviews.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # GitHub App configuration
    GITHUB_APP_ID = os.environ.get("GITHUB_APP_ID")
    GITHUB_WEBHOOK_SECRET = os.environ.get("GITHUB_WEBHOOK_SECRET")
    # GITHUB_PRIVATE_KEY can be the PEM key content directly or a path to a PEM file
    GITHUB_PRIVATE_KEY = os.environ.get("GITHUB_PRIVATE_KEY")
    GITHUB_PRIVATE_KEY_PATH = os.environ.get("GITHUB_PRIVATE_KEY_PATH")

    # Hugging Face configuration
    HF_API_TOKEN = os.environ.get("HF_API_TOKEN")
    HF_MODEL = os.environ.get("HF_MODEL", "Qwen/Qwen2.5-Coder-32B-Instruct")

    @classmethod
    def get_private_key(cls):
        """Retrieve private key content either from env variable directly or from a PEM file."""
        # Skip template values containing "..."
        if cls.GITHUB_PRIVATE_KEY and "..." not in cls.GITHUB_PRIVATE_KEY:
            # Replace literal '\n' with actual newlines if configured in env as a one-liner
            return cls.GITHUB_PRIVATE_KEY.replace("\\n", "\n")
        
        if cls.GITHUB_PRIVATE_KEY_PATH:
            # Search candidate locations relative to both CWD and config directory
            candidates = [
                cls.GITHUB_PRIVATE_KEY_PATH,
                os.path.join("backend", cls.GITHUB_PRIVATE_KEY_PATH),
                os.path.join(os.path.dirname(os.path.abspath(__file__)), cls.GITHUB_PRIVATE_KEY_PATH)
            ]
            for path in candidates:
                if os.path.exists(path):
                    with open(path, "r") as f:
                        return f.read()
                
        return None
