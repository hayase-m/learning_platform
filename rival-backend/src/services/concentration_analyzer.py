import boto3
import base64
import os
from botocore.exceptions import ClientError, NoCredentialsError

# --- 設定 ---
PRESENCE_CONFIDENCE_THRESHOLD = 75
# --- 設定ここまで ---

def analyze_face_presence(image_base64_string):
    """
    Base64形式の画像データを受け取り、顔が在席しているかを判定する
    戻り値: (face_detected: bool, confidence: float, error: str or None)
    """
    try:
        # Base64ヘッダーを削除
        if ',' in image_base64_string:
            image_data = image_base64_string.split(',')[1]
        else:
            image_data = image_base64_string
        
        # Base64をデコード
        image_bytes = base64.b64decode(image_data)
        
        # AWS認証情報を確認
        access_key = os.environ.get('AWS_ACCESS_KEY_ID')
        secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY')
        region = os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')
        
        if not access_key or not secret_key:
            return False, 0, "AWS認証情報が設定されていません"
        
        if access_key == 'YOUR_AWS_ACCESS_KEY_ID':
            return False, 0, "AWS認証情報を実際の値に設定してください"
        
        # AWS Rekognitionクライアントを作成
        rekognition = boto3.client(
            'rekognition',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region
        )
        
        response = rekognition.detect_faces(
            Image={'Bytes': image_bytes},
            Attributes=['DEFAULT']
        )

        if response['FaceDetails']:
            best_face = max(response['FaceDetails'], key=lambda x: x['Confidence'])
            if best_face['Confidence'] >= PRESENCE_CONFIDENCE_THRESHOLD:
                return True, best_face['Confidence'], None
        
        return False, 0, None

    except NoCredentialsError:
        return False, 0, "AWS認証情報が設定されていません"
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'SignatureDoesNotMatch':
            return False, 0, "AWS認証情報が正しくありません。Access KeyとSecret Keyを確認してください。"
        elif error_code == 'InvalidImageFormatException':
            return False, 0, "画像フォーマットが無効です"
        else:
            return False, 0, f"AWS APIエラー: {e.response['Error']['Message']}"
    except Exception as e:
        return False, 0, f"予期しないエラー: {str(e)}"