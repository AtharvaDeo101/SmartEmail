import os
import base64
import secrets
import hashlib
from email.mime.text import MIMEText

from flask import Flask, redirect, session, request, jsonify
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from transformers import pipeline
from dotenv import load_dotenv
from flask_session import Session
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or os.urandom(24)

app.config.update(
    SESSION_TYPE="filesystem",
    SESSION_FILE_DIR="./flask_session",
    SESSION_PERMANENT=False,
    SESSION_USE_SIGNER=True,
    SESSION_COOKIE_NAME="session",
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=False,  # True in production with HTTPS
    SESSION_COOKIE_SAMESITE="Lax",
    PERMANENT_SESSION_LIFETIME=1800,
)

Session(app)

# Allow frontend at 3000 to send/receive cookies
CORS(
    app,
    resources={r"/*": {"origins": "http://localhost:3000", "supports_credentials": True}},
)

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
]
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000/")
REDIRECT_URI = os.environ.get("REDIRECT_URI", "http://localhost:5000/oauth2callback")

email_generator = None
email_summarizer = None


def load_email_generator():
    global email_generator
    if email_generator is None:
        email_generator = pipeline(
            "text2text-generation",
            model="pszemraj/opt-350m-email-generation",
            tokenizer="pszemraj/opt-350m-email-generation",
        )
    return email_generator


def load_email_summarizer():
    global email_summarizer
    if email_summarizer is None:
        email_summarizer = pipeline(
            "summarization",
            model="wordcab/t5-small-email-summarizer",
            tokenizer="wordcab/t5-small-email-summarizer",
        )
    return email_summarizer


def get_gmail_service():
    if "credentials" not in session:
        return None
    creds_dict = session["credentials"]
    creds = Credentials(**creds_dict)
    return build("gmail", "v1", credentials=creds)


@app.route("/")
def index():
    if "credentials" in session:
        return jsonify({"status": "logged_in"})
    return jsonify({"status": "not_logged_in"})


@app.route("/login")
def login():
    code_verifier = secrets.token_urlsafe(32)
    session["code_verifier"] = code_verifier

    code_challenge = (
        base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode()).digest()
        )
        .decode()
        .rstrip("=")
    )

    flow = Flow.from_client_config(
        client_config={
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [REDIRECT_URI],
            }
        },
        scopes=SCOPES,
    )
    flow.redirect_uri = REDIRECT_URI

    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        code_challenge=code_challenge,
        code_challenge_method="S256",
    )
    session["state"] = state
    return redirect(authorization_url)


@app.route("/oauth2callback")
def oauth2callback():
    if "state" not in session or session["state"] != request.args.get("state"):
        return "Invalid state parameter", 400

    if "code_verifier" not in session:
        return "Code verifier not found in session", 400

    code_verifier = session.pop("code_verifier")

    flow = Flow.from_client_config(
        client_config={
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [REDIRECT_URI],
            }
        },
        scopes=SCOPES,
        state=session["state"],
    )
    flow.redirect_uri = REDIRECT_URI

    authorization_response = request.url
    flow.fetch_token(
        authorization_response=authorization_response,
        code_verifier=code_verifier,
    )

    creds = flow.credentials
    session["credentials"] = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": creds.scopes,
    }

    # Redirect back to React/Next app
    return redirect(FRONTEND_URL)


@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"status": "logged_out"})


@app.route("/me")
def me():
    service = get_gmail_service()
    if service is None:
        return jsonify({"error": "not_authenticated"}), 401
    profile = service.users().getProfile(userId="me").execute()
    return jsonify(profile)


@app.route("/send_email", methods=["POST"])
def send_email():
    service = get_gmail_service()
    if service is None:
        return jsonify({"error": "not_authenticated"}), 401

    data = request.get_json() or {}
    to = data.get("to")
    subject = data.get("subject")
    body = data.get("body")

    if not all([to, subject, body]):
        return jsonify({"error": "to, subject, body are required"}), 400

    message = MIMEText(body)
    message["to"] = to
    message["subject"] = subject

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    sent = (
        service.users()
        .messages()
        .send(userId="me", body={"raw": raw})
        .execute()
    )

    return jsonify({"message": "sent", "id": sent.get("id")})


@app.route("/list_emails", methods=["GET"])
def list_emails():
    service = get_gmail_service()
    if service is None:
        return jsonify({"error": "not_authenticated"}), 401

    max_results = request.args.get("max_results", 10, type=int)
    query = request.args.get("q", "")

    result = (
        service.users()
        .messages()
        .list(userId="me", maxResults=max_results, q=query)
        .execute()
    )
    messages = result.get("messages", [])

    email_list = []
    for m in messages:
        msg = (
            service.users()
            .messages()
            .get(
                userId="me",
                id=m["id"],
                format="metadata",
                metadataHeaders=["Subject", "From", "Date"],
            )
            .execute()
        )
        headers = msg.get("payload", {}).get("headers", [])
        subject = next(
            (h["value"] for h in headers if h["name"] == "Subject"), ""
        )
        sender = next(
            (h["value"] for h in headers if h["name"] == "From"), ""
        )
        date = next(
            (h["value"] for h in headers if h["name"] == "Date"), ""
        )

        email_list.append(
            {"id": m["id"], "subject": subject, "from": sender, "date": date}
        )

    return jsonify({"emails": email_list})


def extract_email_body(payload):
    body = ""

    if "parts" in payload:
        for part in payload["parts"]:
            if part.get("mimeType") == "text/plain":
                data = part.get("body", {}).get("data")
                if data:
                    body = base64.urlsafe_b64decode(data).decode(
                        "utf-8", errors="ignore"
                    )
                    break
            elif part.get("mimeType") == "text/html" and not body:
                data = part.get("body", {}).get("data")
                if data:
                    body = base64.urlsafe_b64decode(data).decode(
                        "utf-8", errors="ignore"
                    )
    else:
        data = payload.get("body", {}).get("data")
        if data:
            body = base64.urlsafe_b64decode(data).decode(
                "utf-8", errors="ignore"
            )

    return body


@app.route("/get_email/<email_id>", methods=["GET"])
def get_email(email_id):
    service = get_gmail_service()
    if service is None:
        return jsonify({"error": "not_authenticated"}), 401

    msg = (
        service.users()
        .messages()
        .get(userId="me", id=email_id, format="full")
        .execute()
    )
    payload = msg.get("payload", {})
    headers = payload.get("headers", [])
    subject = next(
        (h["value"] for h in headers if h["name"] == "Subject"), ""
    )
    sender = next(
        (h["value"] for h in headers if h["name"] == "From"), ""
    )
    date = next(
        (h["value"] for h in headers if h["name"] == "Date"), ""
    )

    body = extract_email_body(payload)

    return jsonify(
        {
            "id": email_id,
            "subject": subject,
            "from": sender,
            "date": date,
            "body": body,
        }
    )


@app.route("/create_draft", methods=["POST"])
def create_draft():
    service = get_gmail_service()
    if service is None:
        return jsonify({"error": "not_authenticated"}), 401

    data = request.get_json() or {}
    to = data.get("to")
    subject = data.get("subject")
    body = data.get("body")

    if not all([to, subject, body]):
        return jsonify({"error": "to, subject, body are required"}), 400

    message = MIMEText(body)
    message["to"] = to
    message["subject"] = subject

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    draft = (
        service.users()
        .drafts()
        .create(userId="me", body={"message": {"raw": raw}})
        .execute()
    )

    return jsonify({"message": "draft_created", "id": draft.get("id")})


@app.route("/list_labels", methods=["GET"])
def list_labels():
    service = get_gmail_service()
    if service is None:
        return jsonify({"error": "not_authenticated"}), 401

    result = service.users().labels().list(userId="me").execute()
    labels = result.get("labels", [])
    return jsonify({"labels": labels})


@app.route("/generate_email", methods=["POST"])
def generate_email():
    if "credentials" not in session:
        return jsonify({"error": "not_authenticated"}), 401

    data = request.get_json() or {}
    prompt = data.get("prompt")
    if not prompt:
        return jsonify({"error": "prompt is required"}), 400

    generator = load_email_generator()
    formatted_prompt = f"Write an email: {prompt}"

    out = generator(formatted_prompt, max_length=512, num_return_sequences=1)
    text = out[0]["generated_text"]

    lines = text.strip().split("\\n")
    subject = ""
    body = ""

    for i, line in enumerate(lines):
        if line.lower().startswith("subject:"):
            subject = line[len("subject:") :].strip()
            body = "\\n".join(lines[i + 1 :]).strip()
            break

    if not subject and lines:
        subject = lines[0].strip()
        body = "\\n".join(lines[1:]).strip() if len(lines) > 1 else ""

    if not body:
        body = text.strip()

    return jsonify(
        {
            "subject": subject or "Generated email",
            "body": body,
            "raw_output": text,
        }
    )


@app.route("/summarize_email", methods=["POST"])
def summarize_email():
    if "credentials" not in session:
        return jsonify({"error": "not_authenticated"}), 401

    data = request.get_json() or {}
    content = data.get("content")
    summary_type = data.get("type", "brief")

    if not content:
        return jsonify({"error": "content is required"}), 400

    summarizer = load_email_summarizer()
    if summary_type == "brief":
        prefixed = f"summarize_brief: {content}"
        max_len = 50
    else:
        prefixed = f"summarize_full: {content}"
        max_len = 150

    out = summarizer(prefixed, max_length=max_len, min_length=10)
    summary = out[0]["summary_text"]

    return jsonify(
        {
            "summary": summary,
            "type": summary_type,
            "original_length": len(content),
            "summary_length": len(summary),
        }
    )


if __name__ == "__main__":
    os.makedirs("./flask_session", exist_ok=True)
    app.run(debug=True, port=5000)