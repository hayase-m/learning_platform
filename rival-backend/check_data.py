#!/usr/bin/env python3
import os
import sys
from datetime import datetime

# プロジェクトのルートディレクトリをPythonパスに追加
sys.path.insert(0, os.path.dirname(__file__))

from src.main import app
from src.models.user import db, User, DailyReport

def check_data():
    with app.app_context():
        print("=== ユーザー一覧 ===")
        users = User.query.all()
        for user in users:
            print(f"ID: {user.user_id}, Email: {user.email}")
        
        print("\n=== レポート一覧 ===")
        reports = DailyReport.query.all()
        for report in reports:
            print(f"User: {report.user_id}, Date: {report.date}, Study Time: {report.total_study_time}s")
        
        print(f"\n総ユーザー数: {len(users)}")
        print(f"総レポート数: {len(reports)}")

if __name__ == "__main__":
    check_data()