import { API_BASE_URL } from '../config';
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Play, Pause, Square, Settings, BarChart3, Camera, CameraOff, BookOpen, Repeat } from 'lucide-react'
import FocusMonitor from './FocusMonitor'
import AIFeedback from './AIFeedback'
import ThemeToggle from './ThemeToggle'
import { api } from '../api'
import { auth } from '../firebase'

const WORK_DURATION = 25 * 60; // 25 minutes in seconds
const BREAK_DURATION = 5 * 60; // 5 minutes in seconds

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [showStartMenu, setShowStartMenu] = useState(!sessionStorage.getItem('hasSeenIntro'))
  const [isStudying, setIsStudying] = useState(false)
  const [studyTime, setStudyTime] = useState(0)
  const [currentFocusScore, setCurrentFocusScore] = useState(75)
  const [interruptionCount, setInterruptionCount] = useState(0)
  const [pomodoroTime, setPomodoroTime] = useState(WORK_DURATION) // 25 minutes
  const [isBreak, setIsBreak] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [aiMessages, setAiMessages] = useState([])

  const [targetCycles, setTargetCycles] = useState(4)
  const [currentCycle, setCurrentCycle] = useState(1)

  const studyTimerRef = useRef(null)
  const pomodoroTimerRef = useRef(null)

  const handleStartStudy = () => {
    setCurrentCycle(1)
    setIsStudying(true)
    setCameraEnabled(true)
  }

  const handleStopStudy = useCallback(async () => {
    setIsStudying(false);
    setCameraEnabled(false);

    const today = new Date().toISOString().split('T')[0];

    try {
      const summaryData = await api.generateAiSummary(auth, {
        total_study_time: studyTime,
        interruption_count: interruptionCount,
        ai_personality: '厳しい', // これは設定から取得するように変更するのが望ましい
      });

      await api.saveDailyReport(auth, user.uid, { // user.userIdからuser.uidに変更
        date: today,
        total_study_time: studyTime,
        avg_focus_score: currentFocusScore,
        interruption_count: interruptionCount,
        ai_summary: summaryData.summary || '',
      });

    } catch (error) {
      console.error('Error saving report:', error);
      // ユーザーにエラーを通知する処理を追加するのが望ましい
    }

    // Reset counters
    setStudyTime(0);
    setInterruptionCount(0);
    setPomodoroTime(WORK_DURATION);
    setIsBreak(false);
    setCurrentCycle(1);
  }, [studyTime, interruptionCount, currentFocusScore, user]);

  // ポモドーロタイマーのサイクル遷移ロジック
  useEffect(() => {
    if (isStudying && pomodoroTime <= 0) {
      if (isBreak) {
        // 休憩終了 -> 次の集中時間へ
        setIsBreak(false);
        setCurrentCycle(prevCycle => {
          const nextCycle = prevCycle + 1;
          // 目標サイクルに到達したら自動的に停止
          if (nextCycle > targetCycles) {
            handleStopStudy();
            return prevCycle; // 停止するのでサイクルは進めない
          }
          return nextCycle;
        });
        setPomodoroTime(WORK_DURATION);
      } else {
        // 集中終了 -> 休憩へ
        setIsBreak(true);
        setPomodoroTime(BREAK_DURATION);
      }
    }
  }, [pomodoroTime, isStudying, isBreak, currentCycle, targetCycles, handleStopStudy]);

  useEffect(() => {
    if (isStudying) {
      studyTimerRef.current = setInterval(() => {
        setStudyTime(prev => prev + 1)
      }, 1000)

      pomodoroTimerRef.current = setInterval(() => {
        setPomodoroTime(prevPomodoroTime => {
          if (prevPomodoroTime <= 1) {
            // タイマーが0になったら、次の状態への遷移は別のuseEffectで処理
            return 0; // 一旦0に設定し、次のuseEffectで処理をトリガー
          }
          return prevPomodoroTime - 1;
        });
      }, 1000);
    } else {
      clearInterval(studyTimerRef.current);
      clearInterval(pomodoroTimerRef.current);
    }

    return () => {
      clearInterval(studyTimerRef.current);
      clearInterval(pomodoroTimerRef.current);
    };
  }, [isStudying]); // Narrowed dependency array to only isStudying

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

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro')
    if (hasSeenIntro) {
      setShowStartMenu(false)
    } else {
      const timer = setTimeout(() => {
        setShowStartMenu(false)
        sessionStorage.setItem('hasSeenIntro', 'true')
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [])

  if (showStartMenu) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-foreground mb-4 opacity-0 animate-[fadeInUp_1s_ease-out_forwards]">
            AI Study Buddy <span className="text-primary">"Rival"</span>
          </h1>
          <p className="text-2xl text-muted-foreground opacity-0 animate-[fadeInUp_1s_ease-out_0.5s_forwards]">
            バトルの準備をしています...
          </p>
        </div>
        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          AI Study Buddy <span className="text-primary">"Rival"</span>
        </h1>
        <div className="flex gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/curriculum')}
            className="text-card-foreground border hover:bg-card"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            カリキュラム
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/reports')}
            className="text-card-foreground border hover:bg-card"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            レポート
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/settings')}
            className="text-card-foreground border hover:bg-card"
          >
            <Settings className="w-4 h-4 mr-2" />
            設定
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              sessionStorage.removeItem('hasSeenIntro')
              onLogout()
            }}
            className="text-destructive border-destructive hover:bg-card"
          >
            ログアウト
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Controls and Stats */}
        <div className="space-y-6">
          {/* Study Controls */}
          <Card className="bg-card border">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                {cameraEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                学習コントロール
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isStudying && (
                <div className="space-y-3">
                  <Label htmlFor="cycles" className="text-card-foreground flex items-center gap-2 font-medium">
                    <Repeat className="w-4 h-4" />
                    目標サイクル数
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTargetCycles(Math.max(targetCycles - 1, 1))}
                      className="h-15 w-15 p-0 text-card-foreground border hover:bg-accent text-2xl"
                      disabled={targetCycles <= 1}
                    >
                      -
                    </Button>
                    <div className="flex-1 text-center">
                      <div className="text-2xl text-foreground font-mono">{targetCycles}</div>
                      <div className="text-xs text-muted-foreground font-mono">{targetCycles * 25}分 + 休憩</div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTargetCycles(Math.min(targetCycles + 1, 16))}
                      className="h-15 w-15 p-0 text-card-foreground border hover:bg-accent text-2xl"
                      disabled={targetCycles >= 16}
                    >
                      +
                    </Button>
                  </div>
                </div>
              )}
              {!isStudying ? (
                <Button
                  onClick={handleStartStudy}
                  className="w-full bg-green-600 hover:bg-green-700 text-card-foreground"
                >
                  <Play className="w-4 h-4 mr-2" />
                  学習開始
                </Button>
              ) : (
                <Button
                  onClick={handleStopStudy}
                  className="w-full bg-red-600 hover:bg-red-700 text-card-foreground"
                >
                  <Square className="w-4 h-4 mr-2" />
                  学習終了
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Pomodoro Timer */}
          <Card className="bg-card border">
            <CardHeader>
              <CardTitle className="text-card-foreground">
                学習タイマー
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-mono text-foreground mb-2">
                  {pomodoroMinutes}:{pomodoroSeconds.toString().padStart(2, '0')}
                </div>
                <Badge variant={isBreak ? "secondary" : "default"} className="mb-4">
                  {isBreak ? '休憩時間' : '集中時間'}
                </Badge>
                <Progress
                  value={isBreak ? ((BREAK_DURATION - pomodoroTime) / BREAK_DURATION) * 100 : ((WORK_DURATION - pomodoroTime) / WORK_DURATION) * 100}
                  className="w-full"
                />
                {isStudying && (
                  <div className="text-sm text-card-foreground/70 mt-2 font-mono">
                    サイクル: {currentCycle} / {targetCycles}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Focus Score */}
          <Card className="bg-card border">
            <CardHeader>
              <CardTitle className="text-card-foreground">集中スコア</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl text-foreground mb-2 font-mono">
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
          <Card className="bg-card border">
            <CardHeader>
              <CardTitle className="text-card-foreground">リアルタイム統計</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-foreground">
                <span>総学習時間:</span>
                <span className="font-mono">{formatTime(studyTime)}</span>
              </div>
              <div className="flex justify-between text-card-foreground">
                <span>中断回数:</span>
                <span className="font-mono">{interruptionCount}</span>
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
