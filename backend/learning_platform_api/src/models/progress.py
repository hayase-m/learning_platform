from src.models.user import db
from datetime import datetime
import uuid

class Progress(db.Model):
    __tablename__ = 'progress'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=False)
    lesson_id = db.Column(db.String(36), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending/completed
    completed_at = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'lesson_id': self.lesson_id,
            'status': self.status,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

