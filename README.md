# AI Study Buddy "Rival"

これは、あなたの学習をサポートするAI学習パートナー「Rival」のプロジェクトです。
https://topaz.dev/projects/abacf6a4c3bf2cfd7425

## 概要

AI Study Buddy "Rival"は、Webカメラでユーザーの集中度を測定し、パーソナライズされたフィードバックや学習カリキュラムを提供することで、学習効率の最大化を目的としたアプリケーションです。

- **フロントエンド**: React (Vite)
- **バックエンド**: Python (Flask)
- **データベース**: SQLite & Firebase Firestore
- **認証**: Firebase Authentication
- **AI**: Google Gemini

## プロジェクト構成

```
learning_platform/
├── rival-backend/      # バックエンド (Flask)
│   ├── src/
│   ├── venv/
│   ├── .env.example    # 環境変数ファイルの見本
│   ├── requirements.txt
│   └── README.md       # バックエンド用のREADME
├── rival-frontend/     # フロントエンド (React)
│   ├── src/
│   ├── public/
│   ├── .env.example    # 環境変数ファイルの見本
│   ├── package.json
│   └── README.md       # フロントエンド用のREADME
└── README.md           # このファイル
```

## セットアップと実行

セットアップと実行方法は、各サブプロジェクトのREADMEを参照してください。

- [フロントエンド (rival-frontend/README.md)](./rival-frontend/README.md)
- [バックエンド (rival-backend/README.md)](./rival-backend/README.md)
