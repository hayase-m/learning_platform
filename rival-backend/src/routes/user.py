from flask import Blueprint, jsonify, request
from src.models.user import User, DailyReport, DailyReportComment, db
import uuid
import json
import random

from functools import wraps
from firebase_admin import auth
from flask import request, g

def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(' ')[1]

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            decoded_token = auth.verify_id_token(token)
            g.user = decoded_token # gオブジェクトにユーザー情報を格納
        except Exception as e:
            return jsonify({'error': 'Token is invalid', 'details': str(e)}), 401

        return f(*args, **kwargs)
    return decorated_function
    

user_bp = Blueprint('user', __name__)

# User endpoints
@user_bp.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users', methods=['POST'])
# @token_required  # テスト用に一時的に無効化
def create_user():
    data = request.json or {}
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
        
    # ユーザーがDBに既に存在するか確認
    existing_user = User.query.filter_by(user_id=user_id).first()
    if existing_user:
        # 既に存在する場合は、その情報を返却する（エラーではない）
        return jsonify(existing_user.to_dict()), 200
    
    name = data.get('name')
    if not name:
        name = 'ユーザー'
    
    email = data.get('email')
    if not email:
        return jsonify({'error': 'Email is required'}), 400

    # 新しいユーザーをDBに作成
    new_user = User(
        user_id=user_id,
        name=name,
        email=email
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify(new_user.to_dict()), 201

@user_bp.route('/users/<string:user_id>', methods=['GET'])
# @token_required  # テスト用に一時的に無効化
def get_user(user_id):
    user = User.query.filter_by(user_id=user_id).first_or_404()
    return jsonify(user.to_dict())

@user_bp.route('/users/<string:user_id>', methods=['PUT'])
# @token_required  # テスト用に一時的に無効化
def update_user(user_id):
    try:
        user = User.query.filter_by(user_id=user_id).first_or_404()
        data = request.json or {}
        
        # nameフィールドの処理
        if 'name' in data:
            new_name = data['name']
            if new_name and new_name.strip():
                user.name = new_name.strip()
            else:
                user.name = 'ユーザー'
        
        # その他のフィールドの更新
        if 'ai_personality' in data:
            user.ai_personality = data['ai_personality']
        if 'notification_audio' in data:
            user.notification_audio = data['notification_audio']
        if 'notification_desktop' in data:
            user.notification_desktop = data['notification_desktop']
        if 'focus_threshold' in data:
            user.focus_threshold = data['focus_threshold']
        
        db.session.commit()
        print(f'User updated successfully: {user.to_dict()}')
        return jsonify(user.to_dict())
    except Exception as e:
        print(f'Error updating user: {e}')
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/<string:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.filter_by(user_id=user_id).first_or_404()
    db.session.delete(user)
    db.session.commit()
    return '', 204

# Daily Report endpoints
@user_bp.route('/users/<string:user_id>/reports', methods=['GET'])
def get_user_reports(user_id):
    reports = DailyReport.query.filter_by(user_id=user_id).order_by(DailyReport.date.desc()).all()
    return jsonify([report.to_dict() for report in reports])

@user_bp.route('/users/<string:user_id>/reports/<string:date>', methods=['GET'])
def get_daily_report(user_id, date):
    print(f"Fetching report for user_id: {user_id}, date: {date}")
    report = DailyReport.query.filter_by(user_id=user_id, date=date).first()
    if not report:
        print(f"No report found for user_id: {user_id}, date: {date}")
        return jsonify({'error': 'Report not found'}), 404
    print(f"Report found: {report.to_dict()}")
    return jsonify(report.to_dict())

@user_bp.route('/users/<string:user_id>/reports', methods=['POST'])
# @token_required  # テスト用に一時的に無効化
def create_daily_report(user_id):
    data = request.json
    
    # Check if report for this date already exists
    existing_report = DailyReport.query.filter_by(user_id=user_id, date=data['date']).first()
    if existing_report:
        return jsonify({'error': 'Report for this date already exists'}), 400
    
    report = DailyReport(
        report_id=str(uuid.uuid4()),
        user_id=user_id,
        date=data['date'],
        total_study_time=data.get('total_study_time', 0),
        total_focus_time=data.get('total_focus_time', 0),
        avg_focus_score=data.get('avg_focus_score', 0.0),
        interruption_count=data.get('interruption_count', 0),
        ai_summary=data.get('ai_summary', ''),
        user_notes=data.get('user_notes', ''),
        time_series_focus_data=json.dumps(data.get('time_series_focus_data', []))
    )
    db.session.add(report)
    db.session.commit()
    return jsonify(report.to_dict()), 201

@user_bp.route('/users/<string:user_id>/reports/<string:date>', methods=['PUT'])
# @token_required  # テスト用に一時的に無効化
def update_daily_report(user_id, date):
    report = DailyReport.query.filter_by(user_id=user_id, date=date).first_or_404()
    data = request.json
    
    report.total_study_time = data.get('total_study_time', report.total_study_time)
    report.total_focus_time = data.get('total_focus_time', report.total_focus_time)
    report.avg_focus_score = data.get('avg_focus_score', report.avg_focus_score)
    report.interruption_count = data.get('interruption_count', report.interruption_count)
    report.ai_summary = data.get('ai_summary', report.ai_summary)
    report.user_notes = data.get('user_notes', report.user_notes)
    
    if 'time_series_focus_data' in data:
        report.time_series_focus_data = json.dumps(data['time_series_focus_data'])
    
    db.session.commit()
    return jsonify(report.to_dict())

@user_bp.route('/users/<string:user_id>/reports/<string:date>', methods=['DELETE'])
def delete_daily_report(user_id, date):
    report = DailyReport.query.filter_by(user_id=user_id, date=date).first_or_404()
    db.session.delete(report)
    db.session.commit()
    return '', 204

# AI feedback endpoint
@user_bp.route('/ai/feedback', methods=['POST'])
def generate_ai_feedback():
    data = request.json
    focus_score = data.get('focus_score', 0)
    ai_personality = data.get('ai_personality', '厳しい')
    
    # Simple AI feedback logic based on focus score and personality
    if ai_personality == '厳しい':
        if focus_score < 30:
            messages = [
                "集中力が散漫だ！もっと真剣に取り組め！",
                "このままでは目標達成は不可能だ。気を引き締めろ！",
                "ライバルに負けるつもりか？集中しろ！"
            ]
        elif focus_score < 60:
            messages = [
                "まだまだ甘い。もっと集中できるはずだ。",
                "この程度で満足するな。限界を超えろ！",
                "集中力が足りない。本気を見せろ！"
            ]
        elif focus_score < 80:
            messages = [
                "悪くないが、まだ上を目指せる。",
                "この調子だ。さらに集中力を高めろ。",
                "良いペースだ。油断するな。"
            ]
        else:
            messages = [
                "素晴らしい集中力だ！この調子を維持しろ！",
                "完璧な集中状態だ。ライバルを圧倒しろ！",
                "最高のパフォーマンスだ！"
            ]
    elif ai_personality == '論理的':
        if focus_score < 30:
            messages = [
                "集中スコアが30を下回っています。環境を見直してください。",
                "データによると、集中力が著しく低下しています。",
                "現在の状態では学習効率が20%以下です。"
            ]
        elif focus_score < 60:
            messages = [
                "集中スコア60未満。改善の余地があります。",
                "統計的に見て、もう少し集中力を向上させる必要があります。",
                "現在の集中レベルは平均以下です。"
            ]
        elif focus_score < 80:
            messages = [
                "集中スコア60-80。標準的なレベルです。",
                "データ上、良好な集中状態を維持しています。",
                "現在の集中レベルは適切です。"
            ]
        else:
            messages = [
                "集中スコア80以上。優秀な状態です。",
                "データによると、最適な集中状態を維持しています。",
                "統計的に見て、非常に高い集中力を発揮しています。"
            ]
    else:  # 穏やか
        if focus_score < 30:
            messages = [
                "少し疲れているようですね。無理をしないでください。",
                "集中が難しい時もありますよね。休憩を取りましょう。",
                "今日は調子が出ないようですね。"
            ]
        elif focus_score < 60:
            messages = [
                "もう少し集中できそうですね。頑張りましょう。",
                "集中力を少し上げてみませんか？",
                "あと一歩で良い集中状態になりそうです。"
            ]
        elif focus_score < 80:
            messages = [
                "良い集中状態ですね。この調子で続けましょう。",
                "順調に学習が進んでいますね。",
                "集中できていて素晴らしいです。"
            ]
        else:
            messages = [
                "素晴らしい集中力ですね！",
                "完璧な集中状態です。お疲れ様です。",
                "とても良い調子ですね！"
            ]
    
    return jsonify({'message': random.choice(messages)})

# Generate AI summary for daily report
@user_bp.route('/ai/summary', methods=['POST'])
# @token_required  # テスト用に一時的に無効化
def generate_ai_summary():
    data = request.json
    total_study_time = data.get('total_study_time', 0)
    total_focus_time = data.get('total_focus_time', 0)
    avg_focus_score = data.get('avg_focus_score', 0)
    interruption_count = data.get('interruption_count', 0)
    ai_personality = data.get('ai_personality', '厳しい')
    
    # Convert seconds to hours and minutes
    study_hours = total_study_time // 3600
    study_minutes = (total_study_time % 3600) // 60
    focus_hours = total_focus_time // 3600
    focus_minutes = (total_focus_time % 3600) // 60
    
    focus_percentage = (total_focus_time / total_study_time * 100) if total_study_time > 0 else 0
    
    if ai_personality == '厳しい':
        if avg_focus_score < 50:
            summary = f"今日の成果は不十分だ。学習時間{study_hours}時間{study_minutes}分のうち、集中できたのは{focus_hours}時間{focus_minutes}分（{focus_percentage:.1f}%）だけだった。集中が{interruption_count}回も途切れるとは情けない。明日はもっと真剣に取り組め！"
        elif avg_focus_score < 75:
            summary = f"まずまずの成果だが、まだ甘い。学習時間{study_hours}時間{study_minutes}分、集中時間{focus_hours}時間{focus_minutes}分（{focus_percentage:.1f}%）。{interruption_count}回の中断があった。もっと集中力を高めろ！"
        else:
            summary = f"今日は良く頑張った！学習時間{study_hours}時間{study_minutes}分、集中時間{focus_hours}時間{focus_minutes}分（{focus_percentage:.1f}%）。中断回数{interruption_count}回と少なく、素晴らしい集中力だった。この調子を維持しろ！"
    elif ai_personality == '論理的':
        summary = f"本日の学習データ: 総学習時間{study_hours}時間{study_minutes}分、集中時間{focus_hours}時間{focus_minutes}分（集中率{focus_percentage:.1f}%）、平均集中スコア{avg_focus_score:.1f}、中断回数{interruption_count}回。統計的に見て、"
        if avg_focus_score < 50:
            summary += "改善が必要なレベルです。集中環境の見直しを推奨します。"
        elif avg_focus_score < 75:
            summary += "標準的なパフォーマンスです。さらなる向上の余地があります。"
        else:
            summary += "優秀なパフォーマンスです。このレベルを維持してください。"
    else:  # 穏やか
        summary = f"今日もお疲れ様でした。{study_hours}時間{study_minutes}分の学習時間のうち、{focus_hours}時間{focus_minutes}分（{focus_percentage:.1f}%）集中できましたね。"
        if avg_focus_score < 50:
            summary += f"{interruption_count}回の中断がありましたが、疲れている時もありますよね。明日は無理をせず、自分のペースで頑張りましょう。"
        elif avg_focus_score < 75:
            summary += f"中断回数は{interruption_count}回でした。順調に学習が進んでいますね。明日も頑張りましょう。"
        else:
            summary += f"中断回数{interruption_count}回と少なく、とても集中できていました。素晴らしい一日でしたね！"
    
    return jsonify({'summary': summary})

# Ranking endpoints
@user_bp.route('/rankings/study-time/total', methods=['GET'])
# @token_required  # テスト用に一時的に無効化
def get_total_study_time_ranking():
    from sqlalchemy import func
    
    try:
        rankings = db.session.query(
            User.user_id,
            User.name,
            func.coalesce(func.sum(DailyReport.total_study_time), 0).label('total_study_time')
        ).outerjoin(
            DailyReport, User.user_id == DailyReport.user_id
        ).group_by(
            User.user_id, User.name
        ).order_by(
            func.coalesce(func.sum(DailyReport.total_study_time), 0).desc()
        ).limit(10).all()

        result = []
        for rank, (user_id, name, total_time) in enumerate(rankings, 1):
            result.append({
                'rank': rank,
                'user_id': user_id,
                'name': name,
                'total_study_time': total_time or 0
            })

        print(f'Total study time ranking result: {result}')
        return jsonify(result)
    except Exception as e:
        print(f'Error in get_total_study_time_ranking: {e}')
        return jsonify([])

@user_bp.route('/rankings/focus-time/total', methods=['GET'])
# @token_required  # テスト用に一時的に無効化
def get_total_focus_time_ranking():
    from sqlalchemy import func
    
    try:
        rankings = db.session.query(
            User.user_id,
            User.name,
            func.coalesce(func.sum(DailyReport.total_focus_time), 0).label('total_focus_time')
        ).outerjoin(
            DailyReport, User.user_id == DailyReport.user_id
        ).group_by(
            User.user_id, User.name
        ).order_by(
            func.coalesce(func.sum(DailyReport.total_focus_time), 0).desc()
        ).limit(10).all()

        result = []
        for rank, (user_id, name, total_time) in enumerate(rankings, 1):
            result.append({
                'rank': rank,
                'user_id': user_id,
                'name': name,
                'total_focus_time': total_time or 0
            })

        return jsonify(result)
    except Exception as e:
        print(f'Error in get_total_focus_time_ranking: {e}')
        return jsonify([])

@user_bp.route('/rankings/study-time/today', methods=['GET'])
# @token_required  # テスト用に一時的に無効化
def get_today_study_time_ranking():
    from datetime import date
    
    try:
        today = date.today().strftime('%Y-%m-%d')
        print(f'Looking for today\'s data: {today}')
        
        rankings = db.session.query(
            User.user_id,
            User.name,
            DailyReport.total_study_time
        ).join(
            DailyReport, User.user_id == DailyReport.user_id
        ).filter(
            DailyReport.date == today
        ).order_by(
            DailyReport.total_study_time.desc()
        ).limit(10).all()

        result = []
        for rank, (user_id, name, study_time) in enumerate(rankings, 1):
            result.append({
                'rank': rank,
                'user_id': user_id,
                'name': name,
                'total_study_time': study_time or 0
            })

        print(f'Today study time ranking result: {result}')
        return jsonify(result)
    except Exception as e:
        print(f'Error in get_today_study_time_ranking: {e}')
        return jsonify([])

@user_bp.route('/rankings/focus-time/today', methods=['GET'])
# @token_required  # テスト用に一時的に無効化
def get_today_focus_time_ranking():
    from datetime import date
    
    try:
        today = date.today().strftime('%Y-%m-%d')
        
        rankings = db.session.query(
            User.user_id,
            User.name,
            DailyReport.total_focus_time
        ).join(
            DailyReport, User.user_id == DailyReport.user_id
        ).filter(
            DailyReport.date == today
        ).order_by(
            DailyReport.total_focus_time.desc()
        ).limit(10).all()

        result = []
        for rank, (user_id, name, focus_time) in enumerate(rankings, 1):
            result.append({
                'rank': rank,
                'user_id': user_id,
                'name': name,
                'total_focus_time': focus_time or 0
            })

        return jsonify(result)
    except Exception as e:
        print(f'Error in get_today_focus_time_ranking: {e}')
        return jsonify([])

# Comment endpoints
@user_bp.route('/users/<string:user_id>/comments/<string:date>', methods=['GET'])
def get_daily_comments(user_id, date):
    comments = DailyReportComment.query.filter_by(user_id=user_id, date=date).order_by(DailyReportComment.created_at.desc()).all()
    return jsonify([comment.to_dict() for comment in comments])

@user_bp.route('/users/<string:user_id>/comments', methods=['POST'])
def create_comment(user_id):
    data = request.json
    comment = DailyReportComment(
        comment_id=str(uuid.uuid4()),
        user_id=user_id,
        date=data['date'],
        comment_text=data['comment_text']
    )
    db.session.add(comment)
    db.session.commit()
    return jsonify(comment.to_dict()), 201

@user_bp.route('/comments/<string:comment_id>', methods=['DELETE'])
def delete_comment(comment_id):
    comment = DailyReportComment.query.filter_by(comment_id=comment_id).first_or_404()
    db.session.delete(comment)
    db.session.commit()
    return '', 204
