#!/usr/bin/env python3
import os
import sys
import uuid
from datetime import datetime, date, timedelta
import random

sys.path.insert(0, os.path.dirname(__file__))

from src.main import app
from src.models.user import db, User, DailyReport

def create_test_data():
    with app.app_context():
        # テストユーザーを作成
        test_users = [
            {'user_id': 'user1', 'name': '田中太郎', 'email': 'tanaka@example.com'},
            {'user_id': 'user2', 'name': '佐藤花子', 'email': 'sato@example.com'},
            {'user_id': 'user3', 'name': '鈴木一郎', 'email': 'suzuki@example.com'},
            {'user_id': 'user4', 'name': '高橋美咲', 'email': 'takahashi@example.com'},
            {'user_id': 'user5', 'name': '山田健太', 'email': 'yamada@example.com'},
        ]
        
        for user_data in test_users:
            existing_user = User.query.filter_by(user_id=user_data['user_id']).first()
            if not existing_user:
                user = User(
                    user_id=user_data['user_id'],
                    name=user_data['name'],
                    email=user_data['email']
                )
                db.session.add(user)
        
        db.session.commit()
        print("テストユーザーを作成しました。")
        
        # 過去30日分のテストデータを作成（今日を含む）
        today = date.today()
        for i in range(31):  # 今日を含めるため31日に変更
            current_date = today - timedelta(days=i)
            date_str = current_date.strftime('%Y-%m-%d')
            
            for user_data in test_users:
                user_id = user_data['user_id']
                
                # 既存のレポートがあるかチェック
                existing_report = DailyReport.query.filter_by(user_id=user_id, date=date_str).first()
                if existing_report:
                    continue
                
                # ランダムなデータを生成
                total_study_time = random.randint(1800, 14400)  # 30分〜4時間
                total_focus_time = int(total_study_time * random.uniform(0.6, 0.9))  # 60-90%の集中時間
                avg_focus_score = random.randint(60, 95)
                interruption_count = random.randint(0, 8)
                
                report = DailyReport(
                    report_id=str(uuid.uuid4()),
                    user_id=user_id,
                    date=date_str,
                    total_study_time=total_study_time,
                    total_focus_time=total_focus_time,
                    avg_focus_score=avg_focus_score,
                    interruption_count=interruption_count,
                    ai_summary=f'{user_data["name"]}の学習記録',
                    time_series_focus_data='[]'
                )
                db.session.add(report)
        
        db.session.commit()
        print("テストデータを作成しました。")

if __name__ == "__main__":
    create_test_data()