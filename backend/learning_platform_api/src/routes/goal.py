from flask import Blueprint, jsonify, request
from src.models.goal import Goal, db
from datetime import datetime

goal_bp = Blueprint('goal', __name__)

@goal_bp.route('/goals', methods=['GET'])
def get_goals():
    # In a real app, this would filter by authenticated user
    goals = Goal.query.all()
    return jsonify([goal.to_dict() for goal in goals])

@goal_bp.route('/goals', methods=['POST'])
def create_goal():
    data = request.json
    
    # Parse dates if provided
    start_date = None
    end_date = None
    if data.get('start_date'):
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
    if data.get('end_date'):
        end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
    
    goal = Goal(
        user_id=data.get('user_id', '123e4567-e89b-12d3-a456-426614174000'),  # Mock user ID
        title=data['title'],
        description=data.get('description'),
        start_date=start_date,
        end_date=end_date
    )
    
    db.session.add(goal)
    db.session.commit()
    
    return jsonify(goal.to_dict()), 201

@goal_bp.route('/goals/<string:goal_id>', methods=['GET'])
def get_goal(goal_id):
    goal = Goal.query.get_or_404(goal_id)
    return jsonify(goal.to_dict())

@goal_bp.route('/goals/<string:goal_id>', methods=['PUT'])
def update_goal(goal_id):
    goal = Goal.query.get_or_404(goal_id)
    data = request.json
    
    goal.title = data.get('title', goal.title)
    goal.description = data.get('description', goal.description)
    
    if data.get('start_date'):
        goal.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
    if data.get('end_date'):
        goal.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
    
    db.session.commit()
    return jsonify(goal.to_dict())

@goal_bp.route('/goals/<string:goal_id>', methods=['DELETE'])
def delete_goal(goal_id):
    goal = Goal.query.get_or_404(goal_id)
    db.session.delete(goal)
    db.session.commit()
    return '', 204

