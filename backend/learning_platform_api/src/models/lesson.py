from src.models.user import db
import uuid

class Lesson(db.Model):
    __tablename__ = 'lessons'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    curriculum_id = db.Column(db.String(36), nullable=False)  # Will be linked to curriculum table later
    day = db.Column(db.Integer, nullable=False)  # 学習プラン内の日付（1〜30）
    title = db.Column(db.String(100))
    content = db.Column(db.Text)
    resource_url = db.Column(db.String(255))
    
    def to_dict(self):
        return {
            'id': self.id,
            'curriculum_id': self.curriculum_id,
            'day': self.day,
            'title': self.title,
            'content': self.content,
            'resource_url': self.resource_url
        }

