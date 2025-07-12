#!/usr/bin/env python3
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from src.main import app
from src.models.user import db

def create_comment_table():
    with app.app_context():
        db.create_all()
        print("コメントテーブルを作成しました。")

if __name__ == "__main__":
    create_comment_table()