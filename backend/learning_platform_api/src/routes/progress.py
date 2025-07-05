from flask import Blueprint, jsonify, request
from src.models.progress import Progress, db
from datetime import datetime

progress_bp = Blueprint('progress', __name__)

@progress_bp.route('/progress', methods=['GET'])
def get_progress():
    # In a real app, this would filter by authenticated user
    user_id = request.args.get('user_id', '123e4567-e89b-12d3-a456-426614174000')
    progress_records = Progress.query.filter_by(user_id=user_id).all()
    return jsonify([record.to_dict() for record in progress_records])

@progress_bp.route('/progress', methods=['POST'])
def create_progress():
    data = request.json
    
    progress = Progress(
        user_id=data.get('user_id', '123e4567-e89b-12d3-a456-426614174000'),  # Mock user ID
        lesson_id=data['lesson_id'],
        status=data.get('status', 'pending')
    )
    
    if data.get('status') == 'completed':
        progress.completed_at = datetime.utcnow()
    
    db.session.add(progress)
    db.session.commit()
    
    return jsonify(progress.to_dict()), 201

@progress_bp.route('/progress/<string:progress_id>', methods=['PUT'])
def update_progress(progress_id):
    progress = Progress.query.get_or_404(progress_id)
    data = request.json
    
    progress.status = data.get('status', progress.status)
    
    if data.get('status') == 'completed' and not progress.completed_at:
        progress.completed_at = datetime.utcnow()
    elif data.get('status') == 'pending':
        progress.completed_at = None
    
    db.session.commit()
    return jsonify(progress.to_dict())

@progress_bp.route('/progress/lesson/<string:lesson_id>', methods=['GET'])
def get_progress_by_lesson(lesson_id):
    user_id = request.args.get('user_id', '123e4567-e89b-12d3-a456-426614174000')
    progress = Progress.query.filter_by(user_id=user_id, lesson_id=lesson_id).first()
    
    if progress:
        return jsonify(progress.to_dict())
    else:
        return jsonify({'status': 'not_started'})

