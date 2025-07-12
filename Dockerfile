# このDockerfileは必ずリポジトリのルートに配置してください

# 1. ベースイメージを選択
FROM python:3.11-slim

# 2. コンテナ内の作業ディレクトリを/appに設定
WORKDIR /app

# 3. 依存関係ファイルを先にコピーしてインストール
# リポジトリのルートからrequirements.txtをコピー
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. アプリケーションコードをコピー
# rival-backendディレクトリの内容のみをコピー
COPY rival-backend/ .

# 5. ポートを指定
EXPOSE 8080

# 6. 起動コマンドを定義
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "src.main:app"]
