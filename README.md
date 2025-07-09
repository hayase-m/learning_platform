# Rival 学習プラットフォーム

## はじめに

このガイドでは、Rival 学習プラットフォームをローカルでセットアップし、実行する方法を説明します。

### 前提条件

以下のものがインストールされていることを確認してください。

*   **Python 3.x**
*   **Node.js** (LTS推奨)
*   **pnpm** (フロントエンドのパッケージ管理用)

### セットアップと実行 (初回 / 依存関係が未インストールの場合)

プロジェクトを初めてセットアップする場合、または必要な依存関係がインストールされていない場合は、以下の手順に従ってください。

#### バックエンドのセットアップ

1.  バックエンドディレクトリに移動します。
    ```bash
    cd rival-backend
    ```
2.  Pythonの仮想環境を作成します（まだ作成していない場合）。
    ```bash
    python3 -m venv venv
    ```
3.  仮想環境をアクティベートします。
    *   macOS/Linux:
        ```bash
        source venv/bin/activate
        ```
    *   Windows:
        ```bash
        .\venv\Scripts\activate
        ```
4.  バックエンドの依存関係をインストールします。
    ```bash
    pip install -r requirements.txt
    ```
5.  バックエンドサーバーを起動します。
    ```bash
    python src/main.py
    ```
    バックエンドサーバーは通常、`http://127.0.0.1:5000` (またはFlaskの設定による) で実行されます。

#### フロントエンドのセットアップ

1.  新しいターミナルを開き、フロントエンドディレクトリに移動します。
    ```bash
    cd rival-frontend
    ```
2.  pnpmを使用してフロントエンドの依存関係をインストールします。
    ```bash
    pnpm install
    ```
3.  フロントエンドの開発サーバーを起動します。
    ```bash
    pnpm dev
    ```
    フロントエンドアプリケーションは通常、`http://localhost:5173` (またはViteの設定による) でWebブラウザからアクセスできるようになります。

### 実行 (依存関係が既にインストールされている場合)

すべての依存関係が既にインストールされている場合は、以下の手順でアプリケーションを素早く起動できます。

#### バックエンド

1.  バックエンドディレクトリに移動します。
    ```bash
    cd rival-backend
    ```
2.  仮想環境をアクティベートします。
    *   macOS/Linux:
        ```bash
        source venv/bin/activate
        ```
    *   Windows:
        ```bash
        .\venv\Scripts\activate
        ```
3.  バックエンドサーバーを起動します。
    ```bash
    python src/main.py
    ```

#### フロントエンド

1.  新しいターミナルを開き、フロントエンドディレクトリに移動します。
    ```bash
    cd rival-frontend
    ```
2.  フロントエンドの開発サーバーを起動します。
    ```bash
    pnpm dev
    ```