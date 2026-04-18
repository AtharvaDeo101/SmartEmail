FROM python:3.10-slim

WORKDIR /app

COPY backend/ ./backend/
COPY requirements.docker.txt ./requirements.docker.txt

RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.docker.txt

RUN mkdir -p ./flask_session

ENV FLASK_APP=backend/OAuth.py
ENV FLASK_ENV=production
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_RUN_PORT=5000

EXPOSE 5000

CMD ["flask", "run"]