#!/usr/bin/env python3
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from src.main import app
from src.models.user import db

def update_user_table():
    with app.app_context():
        # テーブルを再作成
        db.create_all()
        print("ユーザーテーブルを更新しました。")

if __name__ == "__main__":
    update_user_table()