# Rival - バックエンド

## 概要

Flaskを使用したバックエンドサーバーです。ユーザー情報、学習カリキュラム、日々のレポートなどを管理するAPIを提供します。

## セットアップ

1. **Python仮想環境の作成と有効化**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **依存関係のインストール**
   ```bash
   pip install -r requirements.txt
   ```

3. **環境変数ファイルの設定**
   `.env.example`をコピーして`.env`ファイルを作成します。
   ```bash
   cp .env.example .env
   ```
   作成した`.env`ファイルをエディタで開き、各項目（SECRET_KEY, GEMINI_API_KEY, FIREBASE_ADMIN_SDK_PATH）を実際値に設定してください。

## 実行

以下のコマンドで開発サーバーを起動します。

```bash
python src/main.py
```

デフォルトでは`http://localhost:5001`でサーバーが起動します。
