# AWS RDS PostgreSQL セットアップガイド

## 1. AWS RDS インスタンスの作成

### RDS インスタンス設定
```
エンジン: PostgreSQL
バージョン: 15.x以上
インスタンスクラス: db.t3.micro (無料利用枠)
ストレージ: 20GB (汎用SSD)
データベース名: rival_learning_platform
マスターユーザー名: postgres
パスワード: [強力なパスワードを設定]
```

### セキュリティグループ設定
```
インバウンドルール:
- タイプ: PostgreSQL
- ポート: 5432
- ソース: 0.0.0.0/0 (本番環境では特定のIPに制限)
```

## 2. 環境変数の設定

`.env`ファイルに以下を追加:
```bash
DATABASE_URL=postgresql://postgres:your_password@your-rds-endpoint.region.rds.amazonaws.com:5432/rival_learning_platform
```

## 3. 依存関係のインストール

```bash
cd rival-backend
pip install -r requirements.txt
```

## 4. データベーステーブルの作成

```bash
cd rival-backend
python src/main.py
```

## 5. 既存データの移行（オプション）

既存のSQLiteデータがある場合:
```bash
cd rival-backend
python migrate_to_rds.py
```

## 6. 接続テスト

アプリケーションを起動して接続を確認:
```bash
cd rival-backend
python src/main.py
```

## トラブルシューティング

### 接続エラーの場合
1. セキュリティグループの設定を確認
2. RDSインスタンスのパブリックアクセス設定を確認
3. DATABASE_URLの形式を確認

### SSL接続エラーの場合
DATABASE_URLに`?sslmode=require`を追加:
```
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

## 本番環境での注意事項

1. **セキュリティグループ**: 特定のIPアドレスのみアクセス許可
2. **SSL/TLS**: 必ず有効化
3. **バックアップ**: 自動バックアップを有効化
4. **モニタリング**: CloudWatchでパフォーマンス監視
5. **パスワード**: 定期的な変更