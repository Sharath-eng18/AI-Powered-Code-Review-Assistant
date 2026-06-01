from app import create_app
from config import Config

app = create_app()

if __name__ == "__main__":
    # Run development server
    app.run(
        host="0.0.0.0",
        port=Config.PORT,
        debug=Config.FLASK_ENV == "development"
    )
