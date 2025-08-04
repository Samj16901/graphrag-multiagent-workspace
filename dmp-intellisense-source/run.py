from flask import Flask
from src.routes import register_routes


def create_app() -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)
    register_routes(app)
    return app


app = create_app()


if __name__ == "__main__":
    # The Flask UI is deprecated; serve only API endpoints
    app.run(host="0.0.0.0", port=5001)
