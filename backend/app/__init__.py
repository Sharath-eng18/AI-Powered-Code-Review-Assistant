from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from app.database import db

def create_app():
    """Application factory to create and configure the Flask app."""
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable Cross-Origin Resource Sharing
    CORS(app)

    # Initialize SQLAlchemy database
    db.init_app(app)

    # Register Blueprints
    from app.routes.webhooks import webhooks_bp
    from app.routes.api import api_bp

    app.register_blueprint(webhooks_bp)
    app.register_blueprint(api_bp, url_prefix="/api")

    # Global error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "Internal server error"}), 500

    # Ensure database tables exist (convenient for SQLite development)
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            app.logger.error(f"Error creating database tables: {str(e)}")

    return app
