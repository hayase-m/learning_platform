# Rival - バックエンド

## 概要

Flaskを使用したバックエンドサーバーです。ユーザー情報、学習カリキュラム、日々のレポートなどを管理するAPIを提供します。

## セットアップ

1. **環境変数ファイルの設定**
   `.env.example`をコピーして`.env`ファイルを作成します。
   ```bash
   cp .env.example .env
   ```
   作成した`.env`ファイルをエディタで開き、各項目（SECRET_KEY, GEMINI_API_KEY, FIREBASE_ADMIN_SDK_PATH）を実際値に設定してください。

2. **dockerビルド**
   以下のコマンドを実行します。
   ```bash
   docker build -t rival .
   docker run --env-file rival-backend/.env -p 5001:8080 rival
   ```
## 実行

以下のコマンドで開発サーバーを起動します。

```bash
python src/main.py
```

デフォルトでは`http://localhost:5001`でサーバーが起動します。
