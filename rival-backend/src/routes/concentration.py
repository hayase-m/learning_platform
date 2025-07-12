from flask import Blueprint, request, jsonify
from src.services.concentration_analyzer import analyze_face_presence
import boto3
import os
from botocore.exceptions import NoCredentialsError
from datetime import datetime

# Blueprintを作成
concentration_bp = Blueprint('concentration', __name__)

# セッション管理用の辞書（本来はデータベースに保存すべき）
sessions = {}

@concentration_bp.route('/test-aws', methods=['GET'])
def test_aws_connection():
    """
    AWS接続テスト用エンドポイント
    """
    try:
        access_key = os.environ.get('AWS_ACCESS_KEY_ID')
        secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY')
        
        if not access_key or not secret_key:
            return jsonify({'error': 'AWS認証情報が設定されていません'}), 400
            
        if access_key == 'YOUR_AWS_ACCESS_KEY_ID':
            return jsonify({'error': 'AWS認証情報を実際の値に設定してください'}), 400
        
        rekognition = boto3.client(
            'rekognition',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')
        )
        
        # サービスのリストを取得して接続テスト
        rekognition.list_collections(MaxResults=1)
        return jsonify({'status': 'AWS Rekognition接続成功'})
    except NoCredentialsError:
        return jsonify({'error': 'AWS認証情報が設定されていません'}), 500
    except Exception as e:
        return jsonify({'error': f'AWS接続エラー: {str(e)}'}), 500

@concentration_bp.route('/session/start', methods=['POST'])
def start_session():
    """
    学習セッションを開始
    """
    data = request.get_json()
    user_id = data.get('userId', 'anonymous')
    
    sessions[user_id] = {
        'start_time': datetime.now(),
        'total_detections': 0,
        'present_detections': 0,
        'last_detection': datetime.now()
    }
    
    return jsonify({'status': 'セッション開始'})

@concentration_bp.route('/session/end', methods=['POST'])
def end_session():
    """
    学習セッションを終了
    """
    data = request.get_json()
    user_id = data.get('userId', 'anonymous')
    
    if user_id in sessions:
        del sessions[user_id]
    
    return jsonify({'status': 'セッション終了'})

@concentration_bp.route('/detect', methods=['POST'])
def detect_face_endpoint():
    """
    顔検出と集中スコア計算API
    """
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400

        user_id = data.get('userId', 'anonymous')
        face_detected, confidence, error = analyze_face_presence(data['image'])

        if error:
            return jsonify({'error': error}), 500

        # セッションが存在しない場合は作成
        if user_id not in sessions:
            sessions[user_id] = {
                'start_time': datetime.now(),
                'total_detections': 0,
                'present_detections': 0,
                'last_detection': datetime.now()
            }
        
        # 検出結果を記録
        session = sessions[user_id]
        session['total_detections'] += 1
        session['last_detection'] = datetime.now()
        
        if face_detected:
            session['present_detections'] += 1
        
        # 集中スコアを計算（在席率）
        focus_score = (session['present_detections'] / session['total_detections']) * 100 if session['total_detections'] > 0 else 0
        
        # 経過時間を計算
        elapsed_time = (datetime.now() - session['start_time']).total_seconds()
        
        return jsonify({
            'faceDetected': face_detected,
            'confidence': confidence,
            'focusScore': round(focus_score, 1),
            'elapsedTime': round(elapsed_time),
            'totalDetections': session['total_detections'],
            'presentDetections': session['present_detections']
        })
    except Exception as e:
        return jsonify({'error': f'サーバーエラー: {str(e)}'}), 500