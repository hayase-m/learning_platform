from src.models.user import db
from datetime import datetime
import json

class Curriculum(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    curriculum_id = db.Column(db.String(128), unique=True, nullable=False)
    user_id = db.Column(db.String(128), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    goal = db.Column(db.Text, nullable=False)
    duration_days = db.Column(db.Integer, nullable=False)
    overview = db.Column(db.Text)
    curriculum_data = db.Column(db.Text, nullable=False)  # JSON string
    status = db.Column(db.String(50), default='active')  # active, completed, archived
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Curriculum {self.curriculum_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'curriculum_id': self.curriculum_id,
            'user_id': self.user_id,
            'title': self.title,
            'goal': self.goal,
            'duration_days': self.duration_days,
            'overview': self.overview,
            'curriculum_data': json.loads(self.curriculum_data) if self.curriculum_data else {},
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class CurriculumProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    progress_id = db.Column(db.String(128), unique=True, nullable=False)
    curriculum_id = db.Column(db.String(128), nullable=False)
    user_id = db.Column(db.String(128), nullable=False)
    day = db.Column(db.Integer, nullable=False)
    completed = db.Column(db.Boolean, default=False)
    completion_date = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    score = db.Column(db.Float)  # 0-100
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<CurriculumProgress {self.progress_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'progress_id': self.progress_id,
            'curriculum_id': self.curriculum_id,
            'user_id': self.user_id,
            'day': self.day,
            'completed': self.completed,
            'completion_date': self.completion_date.isoformat() if self.completion_date else None,
            'notes': self.notes,
            'score': self.score,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

