from flask import Blueprint, jsonify, request
from src.models.lesson import Lesson, db
import uuid

curriculum_bp = Blueprint('curriculum', __name__)

@curriculum_bp.route('/curriculum/generate', methods=['POST'])
def generate_curriculum():
    data = request.json
    goal_title = data.get('goal_title', 'Default Learning Goal')
    duration_days = data.get('duration_days', 30)
    
    # Mock AI-generated curriculum
    curriculum_id = str(uuid.uuid4())
    lessons = []
    
    for day in range(1, duration_days + 1):
        lesson = Lesson(
            curriculum_id=curriculum_id,
            day=day,
            title=f"Day {day}: {goal_title} - Lesson {day}",
            content=f"This is the content for day {day} of your {goal_title} learning journey. Today you will learn about fundamental concepts and practice exercises.",
            resource_url=f"https://example.com/resources/day-{day}"
        )
        lessons.append(lesson)
        db.session.add(lesson)
    
    db.session.commit()
    
    return jsonify({
        'curriculum_id': curriculum_id,
        'goal_title': goal_title,
        'duration_days': duration_days,
        'lessons': [lesson.to_dict() for lesson in lessons]
    }), 201

@curriculum_bp.route('/curriculum/<string:curriculum_id>', methods=['GET'])
def get_curriculum(curriculum_id):
    lessons = Lesson.query.filter_by(curriculum_id=curriculum_id).order_by(Lesson.day).all()
    
    if not lessons:
        return jsonify({'error': 'Curriculum not found'}), 404
    
    return jsonify({
        'curriculum_id': curriculum_id,
        'lessons': [lesson.to_dict() for lesson in lessons]
    })

@curriculum_bp.route('/lessons/<string:lesson_id>', methods=['GET'])
def get_lesson(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    return jsonify(lesson.to_dict())

