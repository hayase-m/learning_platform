from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(128), unique=True, nullable=False)  # Firebase UID
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    ai_personality = db.Column(db.String(50), default='厳しい')
    notification_audio = db.Column(db.Boolean, default=True)
    notification_desktop = db.Column(db.Boolean, default=False)
    focus_threshold = db.Column(db.Integer, default=70)

    def __repr__(self):
        return f'<User {self.user_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'ai_personality': self.ai_personality,
            'notification_audio': self.notification_audio,
            'notification_desktop': self.notification_desktop,
            'focus_threshold': self.focus_threshold
        }

class DailyReport(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.String(128), unique=True, nullable=False)
    user_id = db.Column(db.String(128), nullable=False)
    date = db.Column(db.String(10), nullable=False)  # YYYY-MM-DD format
    total_study_time = db.Column(db.Integer, default=0)  # seconds
    total_focus_time = db.Column(db.Integer, default=0)  # seconds
    avg_focus_score = db.Column(db.Float, default=0.0)  # 0-100
    interruption_count = db.Column(db.Integer, default=0)
    ai_summary = db.Column(db.Text, default='')
    user_notes = db.Column(db.Text, default='')
    time_series_focus_data = db.Column(db.Text, default='[]')  # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<DailyReport {self.report_id}>'

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'report_id': self.report_id,
            'user_id': self.user_id,
            'date': self.date,
            'total_study_time': self.total_study_time,
            'total_focus_time': self.total_focus_time,
            'avg_focus_score': self.avg_focus_score,
            'interruption_count': self.interruption_count,
            'ai_summary': self.ai_summary,
            'user_notes': self.user_notes,
            'time_series_focus_data': json.loads(self.time_series_focus_data) if self.time_series_focus_data else [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class DailyReportComment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    comment_id = db.Column(db.String(128), unique=True, nullable=False)
    user_id = db.Column(db.String(128), nullable=False)
    date = db.Column(db.String(10), nullable=False)  # YYYY-MM-DD format
    comment_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<DailyReportComment {self.comment_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'comment_id': self.comment_id,
            'user_id': self.user_id,
            'date': self.date,
            'comment_text': self.comment_text,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
