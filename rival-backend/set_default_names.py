#!/usr/bin/env python3
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from src.main import app
from src.models.user import db, User

def set_default_names():
    with app.app_context():
        # 名前がnullまたは空の既存ユーザーを取得
        users_without_names = User.query.filter(
            (User.name == None) | (User.name == '')
        ).all()
        
        for user in users_without_names:
            user.name = 'ユーザー'
            print(f"ユーザー {user.user_id} にデフォルト名を設定しました")
        
        db.session.commit()
        print(f"合計 {len(users_without_names)} 人のユーザーにデフォルト名を設定しました。")

if __name__ == "__main__":
    set_default_names()