import { API_BASE_URL } from '../config';
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, Square, Settings, BarChart3, Camera, CameraOff, BookOpen } from 'lucide-react'
import FocusMonitor from './FocusMonitor'
import AIFeedback from './AIFeedback'
import { api } from '../api'
import { auth } from '../firebase'

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [isStudying, setIsStudying] = useState(false)
  const [studyTime, setStudyTime] = useState(0)
  const [focusTime, setFocusTime] = useState(0)
  const [currentFocusScore, setCurrentFocusScore] = useState(75)
  const [interruptionCount, setInterruptionCount] = useState(0)
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60) // 25 minutes
  const [isBreak, setIsBreak] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [aiMessages, setAiMessages] = useState([])

  const studyTimerRef = useRef(null)
  const pomodoroTimerRef = useRef(null)

  useEffect(() => {
    if (isStudying) {
      studyTimerRef.current = setInterval(() => {
        setStudyTime(prev => prev + 1)
        if (currentFocusScore >= 70) {
          setFocusTime(prev => prev + 1)
        }
      }, 1000)

      pomodoroTimerRef.current = setInterval(() => {
        setPomodoroTime(prev => {
          if (prev <= 1) {
            // Pomodoro cycle complete
            if (isBreak) {
              setIsBreak(false)
              return 25 * 60 // Back to work
            } else {
              setIsBreak(true)
              return 5 * 60 // Break time
            }
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(studyTimerRef.current)
      clearInterval(pomodoroTimerRef.current)
    }

    return () => {
      clearInterval(studyTimerRef.current)
      clearInterval(pomodoroTimerRef.current)
    }
  }, [isStudying, currentFocusScore, isBreak])

  const handleStartStudy = () => {
    setIsStudying(true)
    setCameraEnabled(true)
  }

  const handleStopStudy = async () => {
    setIsStudying(false);
    setCameraEnabled(false);

    const today = new Date().toISOString().split('T')[0];
    const avgFocusScore = studyTime > 0 ? (focusTime / studyTime) * 100 : 0;

    try {
      const summaryData = await api.generateAiSummary(auth, {
        total_study_time: studyTime,
        total_focus_time: focusTime,
        avg_focus_score: avgFocusScore,
        interruption_count: interruptionCount,
        ai_personality: '厳しい', // これは設定から取得するように変更するのが望ましい
      });

      await api.saveDailyReport(auth, user.uid, { // user.userIdからuser.uidに変更
        date: today,
        total_study_time: studyTime,
        total_focus_time: focusTime,
        avg_focus_score: avgFocusScore,
        interruption_count: interruptionCount,
        ai_summary: summaryData.summary || '',
      });

    } catch (error) {
      console.error('Error saving report:', error);
      // ユーザーにエラーを通知する処理を追加するのが望ましい
    }

    // Reset counters
    setStudyTime(0);
    setFocusTime(0);
    setInterruptionCount(0);
    setPomodoroTime(25 * 60);
    setIsBreak(false);
  };

  const handleFocusScoreUpdate = (score) => {
    setCurrentFocusScore(score)

    // Check for interruption
    if (score < 50 && currentFocusScore >= 50) {
      setInterruptionCount(prev => prev + 1)
    }
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const pomodoroMinutes = Math.floor(pomodoroTime / 60)
  const pomodoroSeconds = pomodoroTime % 60

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">
          AI Study Buddy <span className="text-purple-400">"Rival"</span>
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/curriculum')}
            className="text-white border-white/20 hover:bg-white/10"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            カリキュラム
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/reports')}
            className="text-white border-white/20 hover:bg-white/10"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            レポート
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/settings')}
            className="text-white border-white/20 hover:bg-white/10"
          >
            <Settings className="w-4 h-4 mr-2" />
            設定
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="text-white border-white/20 hover:bg-white/10"
          >
            ログアウト
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Controls and Stats */}
        <div className="space-y-6">
          {/* Study Controls */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                {cameraEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                学習コントロール
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isStudying ? (
                <Button
                  onClick={handleStartStudy}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Play className="w-4 h-4 mr-2" />
                  学習開始
                </Button>
              ) : (
                <Button
                  onClick={handleStopStudy}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  <Square className="w-4 h-4 mr-2" />
                  学習終了
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Pomodoro Timer */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">
                インテリジェント・ポモドーロ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-mono text-white mb-2">
                  {pomodoroMinutes}:{pomodoroSeconds.toString().padStart(2, '0')}
                </div>
                <Badge variant={isBreak ? "secondary" : "default"} className="mb-4">
                  {isBreak ? '休憩時間' : '集中時間'}
                </Badge>
                <Progress
                  value={isBreak ? ((5 * 60 - pomodoroTime) / (5 * 60)) * 100 : ((25 * 60 - pomodoroTime) / (25 * 60)) * 100}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Focus Score */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">集中スコア</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {currentFocusScore}
                </div>
                <Progress value={currentFocusScore} className="w-full mb-2" />
                <Badge
                  variant={currentFocusScore >= 80 ? "default" : currentFocusScore >= 60 ? "secondary" : "destructive"}
                >
                  {currentFocusScore >= 80 ? '優秀' : currentFocusScore >= 60 ? '良好' : '要改善'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Stats */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">リアルタイム統計</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-white">
                <span>総学習時間:</span>
                <span className="font-mono">{formatTime(studyTime)}</span>
              </div>
              <div className="flex justify-between text-white">
                <span>集中時間:</span>
                <span className="font-mono">{formatTime(focusTime)}</span>
              </div>
              <div className="flex justify-between text-white">
                <span>中断回数:</span>
                <span className="font-mono">{interruptionCount}</span>
              </div>
              <div className="flex justify-between text-white">
                <span>集中率:</span>
                <span className="font-mono">
                  {studyTime > 0 ? Math.round((focusTime / studyTime) * 100) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center - Camera Feed */}
        <div>
          <FocusMonitor
            enabled={cameraEnabled}
            onFocusScoreUpdate={handleFocusScoreUpdate}
          />
        </div>

        {/* Right Sidebar - AI Feedback */}
        <div>
          <AIFeedback
            focusScore={currentFocusScore}
            messages={aiMessages}
            onNewMessage={(message) => setAiMessages(prev => [message, ...prev.slice(0, 9)])}
          />
        </div>
      </div>
    </div>
  )
}
