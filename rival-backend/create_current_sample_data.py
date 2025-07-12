#!/usr/bin/env python3
import os
import sys
from datetime import datetime, timedelta
import uuid
import json

# プロジェクトのルートディレクトリをPythonパスに追加
sys.path.insert(0, os.path.dirname(__file__))

from src.main import app
from src.models.user import db, User, DailyReport

def create_current_sample_data():
    with app.app_context():
        sample_user_id = "sample_user_123"
        
        # 今日から過去7日間のサンプルレポートを作成
        today = datetime.now()
        for i in range(7):
            date = (today - timedelta(days=i)).strftime('%Y-%m-%d')
            
            # 既存のレポートを削除
            existing_report = DailyReport.query.filter_by(user_id=sample_user_id, date=date).first()
            if existing_report:
                db.session.delete(existing_report)
                print(f"既存のレポートを削除しました: {date}")
            
            # ランダムなデータを生成
            import random
            total_study_time = random.randint(3600, 28800)  # 1-8時間
            total_focus_time = int(total_study_time * random.uniform(0.6, 0.9))  # 60-90%
            avg_focus_score = random.uniform(60, 95)
            interruption_count = random.randint(0, 8)
            
            # AI要約を生成
            study_hours = total_study_time // 3600
            study_minutes = (total_study_time % 3600) // 60
            focus_hours = total_focus_time // 3600
            focus_minutes = (total_focus_time % 3600) // 60
            focus_percentage = (total_focus_time / total_study_time * 100)
            
            ai_summary = f"今日は{study_hours}時間{study_minutes}分の学習時間のうち、{focus_hours}時間{focus_minutes}分（{focus_percentage:.1f}%）集中できました。平均集中スコアは{avg_focus_score:.1f}で、{interruption_count}回の中断がありました。"
            
            if avg_focus_score >= 80:
                ai_summary += "素晴らしい集中力でした！この調子を維持してください。"
            elif avg_focus_score >= 60:
                ai_summary += "良い集中状態でした。さらなる向上を目指しましょう。"
            else:
                ai_summary += "集中力に改善の余地があります。環境を見直してみてください。"
            
            report = DailyReport(
                report_id=str(uuid.uuid4()),
                user_id=sample_user_id,
                date=date,
                total_study_time=total_study_time,
                total_focus_time=total_focus_time,
                avg_focus_score=avg_focus_score,
                interruption_count=interruption_count,
                ai_summary=ai_summary,
                user_notes="",
                time_series_focus_data=json.dumps([])
            )
            db.session.add(report)
            print(f"新しいサンプルレポートを作成しました: {date}")
        
        db.session.commit()
        print("現在の日付でのサンプルデータの作成が完了しました。")

if __name__ == "__main__":
    create_current_sample_data()