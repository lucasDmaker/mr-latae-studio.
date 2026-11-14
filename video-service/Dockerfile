FROM python:3.12-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY service.py .
RUN useradd --create-home studio && mkdir /data && chown studio:studio /data
USER studio
ENV PORT=10000 DATA_DIR=/data
CMD ["python", "service.py"]
