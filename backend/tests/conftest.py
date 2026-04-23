import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

os.environ.setdefault("FLASK_SECRET_KEY", "test-secret-key-for-ci")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-client-id")
os.environ.setdefault("GOOGLE_CLIENT_SECRET", "test-client-secret")
os.environ.setdefault("HF_API_TOKEN", "test-hf-token")
os.environ.setdefault("FRONTEND_URL", "http://localhost:3000/")
os.environ.setdefault("REDIRECT_URI", "http://localhost:5000/oauth2callback")


@pytest.fixture
def app():
    from OAuth import app as flask_app

    flask_app.config.update(
        TESTING=True,
        SESSION_TYPE="filesystem",
        SESSION_FILE_DIR="./flask_session_test",
        SESSION_COOKIE_SECURE=False,
    )
    os.makedirs("./flask_session_test", exist_ok=True)
    yield flask_app


@pytest.fixture
def client(app):
    return app.test_client()
