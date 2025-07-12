import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Camera, CameraOff, AlertTriangle } from 'lucide-react'

export default function FocusMonitor({ enabled, onFocusScoreUpdate }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [detectionData, setDetectionData] = useState({
    faceDetected: false,
    eyesOpen: true,
    lookingAtScreen: true,
    posture: 'good'
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
      
      // Start focus detection simulation
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

  const startFocusDetection = () => {
    // Simulate focus detection with random variations
    const detectFocus = () => {
      if (!enabled) return
      
      // Simulate realistic focus score variations
      const baseScore = 70 + Math.random() * 20 // 70-90 base range
      const variation = (Math.random() - 0.5) * 30 // ±15 variation
      const focusScore = Math.max(0, Math.min(100, Math.round(baseScore + variation)))
      
      // Simulate detection data
      const newDetectionData = {
        faceDetected: Math.random() > 0.1, // 90% face detection rate
        eyesOpen: Math.random() > 0.05, // 95% eyes open
        lookingAtScreen: Math.random() > 0.2, // 80% looking at screen
        posture: Math.random() > 0.3 ? 'good' : 'poor' // 70% good posture
      }
      
      setDetectionData(newDetectionData)
      
      // Calculate focus score based on detection data
      let adjustedScore = focusScore
      if (!newDetectionData.faceDetected) adjustedScore *= 0.3
      if (!newDetectionData.eyesOpen) adjustedScore *= 0.2
      if (!newDetectionData.lookingAtScreen) adjustedScore *= 0.6
      if (newDetectionData.posture === 'poor') adjustedScore *= 0.8
      
      onFocusScoreUpdate(Math.round(adjustedScore))
      
      setTimeout(detectFocus, 2000) // Update every 2 seconds
    }
    
    detectFocus()
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
          <div className={`p-2 rounded ${detectionData.eyesOpen ? 'bg-green-500/20 text-primary' : 'bg-red-500/20 text-destructive'}`}>
            目の状態: {detectionData.eyesOpen ? '開いている' : '閉じている'}
          </div>
          <div className={`p-2 rounded ${detectionData.lookingAtScreen ? 'bg-green-500/20 text-primary' : 'bg-red-500/20 text-destructive'}`}>
            視線: {detectionData.lookingAtScreen ? '画面を見ている' : '逸れている'}
          </div>
          <div className={`p-2 rounded ${detectionData.posture === 'good' ? 'bg-green-500/20 text-primary' : 'bg-yellow-500/20 text-yellow-300'}`}>
            姿勢: {detectionData.posture === 'good' ? '良好' : '要改善'}
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground text-center">
          ※ 映像はサーバーに送信されず、ブラウザ内で処理されます
        </div>
      </CardContent>
    </Card>
  )
}

