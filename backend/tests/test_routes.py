import json
from unittest.mock import patch, MagicMock
import base64


class TestIndexRoute:
    def test_index_not_logged_in(self, client):
        response = client.get("/")
        assert response.status_code == 200
        assert json.loads(response.data)["status"] == "not_logged_in"

    def test_index_logged_in(self, client):
        with client.session_transaction() as sess:
            sess["credentials"] = {
                "token": "fake-token",
                "refresh_token": "r",
                "token_uri": "https://oauth2.googleapis.com/token",
                "client_id": "c",
                "client_secret": "s",
                "scopes": [],
            }
        response = client.get("/")
        assert json.loads(response.data)["status"] == "logged_in"


class TestLogoutRoute:
    def test_logout_clears_session(self, client):
        with client.session_transaction() as sess:
            sess["credentials"] = {"token": "fake"}
        response = client.post("/logout")
        assert response.status_code == 200
        assert json.loads(response.data)["status"] == "logged_out"

    def test_logout_without_session(self, client):
        assert client.post("/logout").status_code == 200


class TestMeRoute:
    def test_me_unauthenticated(self, client):
        response = client.get("/me")
        assert response.status_code == 401
        assert json.loads(response.data)["error"] == "not_authenticated"

    @patch("OAuth.build")
    @patch("OAuth.Credentials")
    def test_me_authenticated(self, mock_creds, mock_build, client):
        mock_service = MagicMock()
        mock_service.users().getProfile(userId="me").execute.return_value = {"emailAddress": "test@example.com"}
        mock_build.return_value = mock_service
        with client.session_transaction() as sess:
            sess["credentials"] = {
                "token": "t",
                "refresh_token": "r",
                "token_uri": "https://oauth2.googleapis.com/token",
                "client_id": "c",
                "client_secret": "s",
                "scopes": [],
            }
        response = client.get("/me")
        assert response.status_code == 200
        assert json.loads(response.data)["emailAddress"] == "test@example.com"


class TestSendEmailRoute:
    def test_send_email_unauthenticated(self, client):
        assert client.post("/send_email", json={"to": "a@b.com", "subject": "Hi", "body": "Hello"}).status_code == 401

    def test_send_email_missing_fields(self, client):
        with client.session_transaction() as sess:
            sess["credentials"] = {
                "token": "t",
                "refresh_token": "r",
                "token_uri": "https://oauth2.googleapis.com/token",
                "client_id": "c",
                "client_secret": "s",
                "scopes": [],
            }
        with patch("OAuth.build"), patch("OAuth.Credentials"):
            response = client.post("/send_email", json={"to": "a@b.com"})
        assert response.status_code == 400

    @patch("OAuth.build")
    @patch("OAuth.Credentials")
    def test_send_email_success(self, mock_creds, mock_build, client):
        mock_service = MagicMock()
        mock_service.users().messages().send().execute.return_value = {"id": "msg-123"}
        mock_build.return_value = mock_service
        with client.session_transaction() as sess:
            sess["credentials"] = {
                "token": "t",
                "refresh_token": "r",
                "token_uri": "https://oauth2.googleapis.com/token",
                "client_id": "c",
                "client_secret": "s",
                "scopes": [],
            }
        response = client.post("/send_email", json={"to": "test@example.com", "subject": "Test", "body": "Body"})
        assert response.status_code == 200
        assert json.loads(response.data)["message"] == "sent"


class TestGenerateEmailRoute:
    def test_generate_unauthenticated(self, client):
        assert client.post("/generate_email", json={"prompt": "write"}).status_code == 401

    def test_generate_missing_prompt(self, client):
        with client.session_transaction() as sess:
            sess["credentials"] = {"token": "t"}
        assert client.post("/generate_email", json={}).status_code == 400

    @patch("OAuth.generate_with_api")
    def test_generate_success(self, mock_gen, client):
        mock_gen.return_value = "Subject: Meeting\n\nDear John,\n\nLet's meet.\n\nBest,\nMe"
        with client.session_transaction() as sess:
            sess["credentials"] = {"token": "t"}
        response = client.post("/generate_email", json={"prompt": "schedule a meeting"})
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["subject"] == "Meeting"
        assert "Dear John" in data["body"]

    @patch("OAuth.generate_with_api")
    def test_generate_api_error(self, mock_gen, client):
        mock_gen.side_effect = Exception("API down")
        with client.session_transaction() as sess:
            sess["credentials"] = {"token": "t"}
        assert client.post("/generate_email", json={"prompt": "hi"}).status_code == 500


class TestSummarizeEmailRoute:
    def test_summarize_unauthenticated(self, client):
        assert client.post("/summarize_email", json={"content": "text"}).status_code == 401

    def test_summarize_missing_content(self, client):
        with client.session_transaction() as sess:
            sess["credentials"] = {"token": "t"}
        assert client.post("/summarize_email", json={}).status_code == 400

    @patch("OAuth.summarize_with_api")
    def test_summarize_brief(self, mock_sum, client):
        mock_sum.return_value = "This is about a meeting."
        with client.session_transaction() as sess:
            sess["credentials"] = {"token": "t"}
        response = client.post("/summarize_email", json={"content": "Long email...", "type": "brief"})
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["type"] == "brief"
        assert "summary" in data


class TestHelperFunctions:
    def test_decode_body(self):
        from OAuth import _decode_body

        encoded = base64.urlsafe_b64encode(b"Hello World").decode()
        assert _decode_body(encoded) == "Hello World"

    def test_decode_body_empty(self):
        from OAuth import _decode_body

        assert _decode_body("") == ""
        assert _decode_body(None) == ""

    def test_html_to_text(self):
        from OAuth import _html_to_text

        result = _html_to_text("<p>Hello</p><p>World</p>")
        assert "Hello" in result and "World" in result

    def test_extract_plain_body(self):
        from OAuth import extract_email_body

        encoded = base64.urlsafe_b64encode(b"Plain content").decode()
        result = extract_email_body({"mimeType": "text/plain", "body": {"data": encoded}})
        assert result["plain_body"] == "Plain content"

    def test_extract_multipart_body(self):
        from OAuth import extract_email_body

        plain = base64.urlsafe_b64encode(b"Plain").decode()
        html = base64.urlsafe_b64encode(b"<p>HTML</p>").decode()
        payload = {
            "mimeType": "multipart/alternative",
            "parts": [
                {"mimeType": "text/plain", "body": {"data": plain}},
                {"mimeType": "text/html", "body": {"data": html}},
            ],
        }
        result = extract_email_body(payload)
        assert result["plain_body"] == "Plain"
        assert "<p>HTML</p>" in result["html_body"]
