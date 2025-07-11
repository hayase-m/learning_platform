from flask import Blueprint, jsonify, request
from src.models.curriculum import Curriculum, CurriculumProgress, db
from src.services.gemini_service import GeminiService
import uuid
import json
from datetime import datetime

curriculum_bp = Blueprint('curriculum', __name__)

# Gemini API key (本来は環境変数から取得すべき)
GEMINI_API_KEY = "AIzaSyCzrboYCnZt-YzZR4xwc3wKj8Gn1AoS1zc"

# Curriculum endpoints
@curriculum_bp.route('/curriculums', methods=['GET'])
def get_curriculums():
    """全てのカリキュラムを取得"""
    curriculums = Curriculum.query.all()
    return jsonify([curriculum.to_dict() for curriculum in curriculums])

@curriculum_bp.route('/users/<string:user_id>/curriculums', methods=['GET'])
def get_user_curriculums(user_id):
    """特定ユーザーのカリキュラムを取得"""
    curriculums = Curriculum.query.filter_by(user_id=user_id).order_by(Curriculum.created_at.desc()).all()
    return jsonify([curriculum.to_dict() for curriculum in curriculums])

@curriculum_bp.route('/curriculums/<string:curriculum_id>', methods=['GET'])
def get_curriculum(curriculum_id):
    """特定のカリキュラムを取得"""
    curriculum = Curriculum.query.filter_by(curriculum_id=curriculum_id).first_or_404()
    return jsonify(curriculum.to_dict())

@curriculum_bp.route('/users/<string:user_id>/curriculums', methods=['POST'])
def create_curriculum(user_id):
    """新しいカリキュラムを生成・作成"""
    data = request.json
    
    # 必須フィールドの検証
    if 'goal' not in data:
        return jsonify({'error': 'Goal is required'}), 400
    
    goal = data['goal']
    duration_days = data.get('duration_days', 30)
    
    try:
        # Gemini APIを使用してカリキュラムを生成
        gemini_service = GeminiService(GEMINI_API_KEY)
        curriculum_data = gemini_service.generate_curriculum(goal, duration_days)
        
        # データベースに保存
        curriculum = Curriculum(
            curriculum_id=str(uuid.uuid4()),
            user_id=user_id,
            title=curriculum_data.get('curriculum_title', f'{goal}の学習カリキュラム'),
            goal=goal,
            duration_days=duration_days,
            overview=curriculum_data.get('overview', ''),
            curriculum_data=json.dumps(curriculum_data, ensure_ascii=False),
            status='active'
        )
        
        db.session.add(curriculum)
        db.session.commit()
        
        # 各日の進捗レコードを初期化
        for day in range(1, duration_days + 1):
            progress = CurriculumProgress(
                progress_id=str(uuid.uuid4()),
                curriculum_id=curriculum.curriculum_id,
                user_id=user_id,
                day=day,
                completed=False
            )
            db.session.add(progress)
        
        db.session.commit()
        
        return jsonify(curriculum.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to generate curriculum: {str(e)}'}), 500

@curriculum_bp.route('/curriculums/<string:curriculum_id>', methods=['PUT'])
def update_curriculum(curriculum_id):
    """カリキュラムを更新"""
    curriculum = Curriculum.query.filter_by(curriculum_id=curriculum_id).first_or_404()
    data = request.json
    
    curriculum.title = data.get('title', curriculum.title)
    curriculum.overview = data.get('overview', curriculum.overview)
    curriculum.status = data.get('status', curriculum.status)
    
    if 'curriculum_data' in data:
        curriculum.curriculum_data = json.dumps(data['curriculum_data'], ensure_ascii=False)
    
    db.session.commit()
    return jsonify(curriculum.to_dict())

@curriculum_bp.route('/curriculums/<string:curriculum_id>', methods=['DELETE'])
def delete_curriculum(curriculum_id):
    """カリキュラムを削除"""
    curriculum = Curriculum.query.filter_by(curriculum_id=curriculum_id).first_or_404()
    
    # 関連する進捗レコードも削除
    CurriculumProgress.query.filter_by(curriculum_id=curriculum_id).delete()
    
    db.session.delete(curriculum)
    db.session.commit()
    return '', 204

# Progress endpoints
@curriculum_bp.route('/curriculums/<string:curriculum_id>/progress', methods=['GET'])
def get_curriculum_progress(curriculum_id):
    """カリキュラムの進捗を取得"""
    progress_list = CurriculumProgress.query.filter_by(curriculum_id=curriculum_id).order_by(CurriculumProgress.day).all()
    return jsonify([progress.to_dict() for progress in progress_list])

@curriculum_bp.route('/curriculums/<string:curriculum_id>/progress/<int:day>', methods=['GET'])
def get_day_progress(curriculum_id, day):
    """特定の日の進捗を取得"""
    progress = CurriculumProgress.query.filter_by(curriculum_id=curriculum_id, day=day).first_or_404()
    return jsonify(progress.to_dict())

@curriculum_bp.route('/curriculums/<string:curriculum_id>/progress/<int:day>', methods=['PUT'])
def update_day_progress(curriculum_id, day):
    """特定の日の進捗を更新"""
    progress = CurriculumProgress.query.filter_by(curriculum_id=curriculum_id, day=day).first_or_404()
    data = request.json
    
    progress.completed = data.get('completed', progress.completed)
    progress.notes = data.get('notes', progress.notes)
    progress.score = data.get('score', progress.score)
    
    if data.get('completed') and not progress.completion_date:
        progress.completion_date = datetime.utcnow()
    elif not data.get('completed'):
        progress.completion_date = None
    
    db.session.commit()
    return jsonify(progress.to_dict())

@curriculum_bp.route('/users/<string:user_id>/curriculums/<string:curriculum_id>/progress', methods=['GET'])
def get_user_curriculum_progress(user_id, curriculum_id):
    """特定ユーザーの特定カリキュラムの進捗を取得"""
    progress_list = CurriculumProgress.query.filter_by(
        curriculum_id=curriculum_id, 
        user_id=user_id
    ).order_by(CurriculumProgress.day).all()
    return jsonify([progress.to_dict() for progress in progress_list])

# AI-powered curriculum regeneration
@curriculum_bp.route('/curriculums/<string:curriculum_id>/regenerate', methods=['POST'])
def regenerate_curriculum(curriculum_id):
    """既存のカリキュラムを再生成"""
    curriculum = Curriculum.query.filter_by(curriculum_id=curriculum_id).first_or_404()
    data = request.json
    
    # 新しい目標が指定されていれば使用、そうでなければ既存の目標を使用
    goal = data.get('goal', curriculum.goal)
    duration_days = data.get('duration_days', curriculum.duration_days)
    
    try:
        # Gemini APIを使用してカリキュラムを再生成
        gemini_service = GeminiService(GEMINI_API_KEY)
        curriculum_data = gemini_service.generate_curriculum(goal, duration_days)
        
        # カリキュラムデータを更新
        curriculum.title = curriculum_data.get('curriculum_title', f'{goal}の学習カリキュラム')
        curriculum.goal = goal
        curriculum.duration_days = duration_days
        curriculum.overview = curriculum_data.get('overview', '')
        curriculum.curriculum_data = json.dumps(curriculum_data, ensure_ascii=False)
        
        # 既存の進捗レコードを削除
        CurriculumProgress.query.filter_by(curriculum_id=curriculum_id).delete()
        
        # 新しい進捗レコードを作成
        for day in range(1, duration_days + 1):
            progress = CurriculumProgress(
                progress_id=str(uuid.uuid4()),
                curriculum_id=curriculum.curriculum_id,
                user_id=curriculum.user_id,
                day=day,
                completed=False
            )
            db.session.add(progress)
        
        db.session.commit()
        
        return jsonify(curriculum.to_dict())
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to regenerate curriculum: {str(e)}'}), 500

# Curriculum statistics
@curriculum_bp.route('/curriculums/<string:curriculum_id>/stats', methods=['GET'])
def get_curriculum_stats(curriculum_id):
    """カリキュラムの統計情報を取得"""
    curriculum = Curriculum.query.filter_by(curriculum_id=curriculum_id).first_or_404()
    progress_list = CurriculumProgress.query.filter_by(curriculum_id=curriculum_id).all()
    
    total_days = len(progress_list)
    completed_days = len([p for p in progress_list if p.completed])
    completion_rate = (completed_days / total_days * 100) if total_days > 0 else 0
    
    # 平均スコア計算
    scores = [p.score for p in progress_list if p.score is not None]
    average_score = sum(scores) / len(scores) if scores else 0
    
    stats = {
        'curriculum_id': curriculum_id,
        'total_days': total_days,
        'completed_days': completed_days,
        'remaining_days': total_days - completed_days,
        'completion_rate': round(completion_rate, 2),
        'average_score': round(average_score, 2),
        'status': curriculum.status,
        'created_at': curriculum.created_at.isoformat() if curriculum.created_at else None
    }
    
    return jsonify(stats)

