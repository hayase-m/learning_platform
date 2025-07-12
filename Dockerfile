# AWS App Runner用のDockerfile
FROM python:3.11-slim

# ワーキングディレクトリを設定
WORKDIR /app

# まず依存関係ファイルをコピーしてインストール（キャッシュ効率のため）
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー
COPY rival-backend/ ./

# ポートを公開
EXPOSE 8080

# アプリケーションを起動
CMD ["python3", "-m", "gunicorn", "-w", "2", "src.main:app", "--bind", "0.0.0.0:8080"]
