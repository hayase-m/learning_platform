import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Camera, CameraOff, AlertTriangle } from 'lucide-react'
import axios from 'axios';

export default function FocusMonitor({ enabled, onFocusScoreUpdate }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [detectionData, setDetectionData] = useState({
    faceDetected: false,
    confidence: 0,
    focusScore: 0,
    elapsedTime: 0,
    totalDetections: 0,
    presentDetections: 0
  })

  useEffect(() => {
    if (enabled) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [enabled])

  const startCamera = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 }
        }
      })

      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }

      startFocusDetection()

    } catch (err) {
      setError('カメラへのアクセスが拒否されました。ブラウザの設定を確認してください。')
      console.error('Camera access error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
  }

  const startFocusDetection = () => {
    const detectFocus = async () => {
      if (!enabled) return;

      const image = captureFrame();
      if (image) {
        try {
          const response = await axios.post('/api/concentration/detect', { image });
          const data = response.data;
          setDetectionData(data);
          onFocusScoreUpdate(data.focusScore || 0);
          setError(null);
        } catch (error) {
          console.error('Error detecting face:', error);
          const errorMessage = error.response?.data?.error || 'サーバーとの通信に失敗しました。';
          setError(errorMessage);
          setDetectionData({ faceDetected: false, confidence: 0, focusScore: 0, elapsedTime: 0, totalDetections: 0, presentDetections: 0 });
          onFocusScoreUpdate(0);
        }
      }

      setTimeout(detectFocus, 2000); // 2秒ごとに検出
    }

    detectFocus();
  }

  if (!enabled) {
    return (
      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <CameraOff className="w-5 h-5" />
            集中度モニタリング
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <CameraOff className="w-12 h-12 mx-auto mb-2" />
              <p>学習を開始してカメラを有効にしてください</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border">
      <CardHeader>
        <CardTitle className="text-card-foreground flex items-center gap-2">
          <Camera className="w-5 h-5" />
          集中度モニタリング
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert className="bg-red-500/20 border-red-500/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-foreground">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <video
            ref={videoRef}
            className="w-full aspect-video bg-muted rounded-lg"
            autoPlay
            muted
            playsInline
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ display: 'none' }}
          />

          {isLoading && (
            <div className="absolute inset-0 bg-muted/50 rounded-lg flex items-center justify-center">
              <div className="text-foreground">カメラを起動中...</div>
            </div>
          )}
        </div>

        {/* Detection Status */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className={`p-2 rounded ${detectionData.faceDetected ? 'bg-green-500/20 text-primary' : 'bg-red-500/20 text-destructive'}`}>
            顔検出: {detectionData.faceDetected ? '✓' : '✗'}
          </div>
          <div className={`p-2 rounded bg-blue-500/20 text-blue-300`}>
            集中スコア: {detectionData.focusScore}%
          </div>
        </div>

        <div className="text-xs text-slate-400 text-center">
          集中スコア = 在席時間 / 総測定時間 × 100%
        </div>
      </CardContent>
    </Card>
  )
}