import { API_BASE_URL } from '../config';
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Play, Pause, Square, Settings, BarChart3, Camera, CameraOff, BookOpen, Repeat, Clock } from 'lucide-react'
import FocusMonitor from './FocusMonitor'
import ThemeToggle from './ThemeToggle'
import { api } from '../api'
import { auth } from '../firebase'

const WORK_DURATION = 25 * 60; // 25 minutes in seconds
const BREAK_DURATION = 5 * 60; // 5 minutes in seconds

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  const [showStartMenu, setShowStartMenu] = useState(!sessionStorage.getItem('hasSeenIntro'))
  const [isStudying, setIsStudying] = useState(false)
  const [studyTime, setStudyTime] = useState(0)
  const [currentFocusScore, setCurrentFocusScore] = useState(75)
  const [interruptionCount, setInterruptionCount] = useState(0)
  const [pomodoroTime, setPomodoroTime] = useState(WORK_DURATION) // 25 minutes
  const [isBreak, setIsBreak] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(false)

  const [targetCycles, setTargetCycles] = useState(4)
  const [currentCycle, setCurrentCycle] = useState(1)
  const [selectedTask, setSelectedTask] = useState(null)
  const [activityChecklist, setActivityChecklist] = useState({})

  const studyTimerRef = useRef(null)
  const pomodoroTimerRef = useRef(null)

  // 選択中のタスクを読み込み
  useEffect(() => {
    const task = localStorage.getItem('selectedTask');
    if (task) {
      setSelectedTask(JSON.parse(task));
    }
    const checklist = localStorage.getItem('activityChecklist');
    if (checklist) {
      setActivityChecklist(JSON.parse(checklist));
    }
  }, []);

  // アクティビティのチェック状態を更新
  const handleActivityCheck = (activityIndex, checked) => {
    const newChecklist = {
      ...activityChecklist,
      [`${selectedTask.curriculumId}-${selectedTask.day}-${activityIndex}`]: checked
    };
    setActivityChecklist(newChecklist);
    localStorage.setItem('activityChecklist', JSON.stringify(newChecklist));
  };

  const handleStartStudy = () => {
    setCurrentCycle(1)
    setIsStudying(true)
    setCameraEnabled(true)
  }

  const handleStopStudy = useCallback(async () => {
    setIsStudying(false);
    setCameraEnabled(false);

    const today = new Date().toISOString().split('T')[0];
    const userId = user?.uid || 'sample_user_123';
    const totalFocusTime = Math.round(studyTime * (currentFocusScore / 100));

    try {
      // AI要約を生成
      const summaryData = await api.generateAiSummary(auth, {
        total_study_time: studyTime,
        total_focus_time: totalFocusTime,
        avg_focus_score: currentFocusScore,
        interruption_count: interruptionCount,
        ai_personality: '厳しい'
      });

      // 既存のレポートを取得して更新、または新規作成
      let existingReport = null;
      try {
        existingReport = await api.fetchUserReports(auth, userId, today);
      } catch (error) {
        console.log('No existing report found, creating new one');
      }

      const reportData = {
        date: today,
        total_study_time: (existingReport?.total_study_time || 0) + studyTime,
        total_focus_time: (existingReport?.total_focus_time || 0) + totalFocusTime,
        avg_focus_score: existingReport ? 
          ((existingReport.avg_focus_score + currentFocusScore) / 2) : currentFocusScore,
        interruption_count: (existingReport?.interruption_count || 0) + interruptionCount,
        ai_summary: summaryData.summary || '',
        user_notes: existingReport?.user_notes || ''
      };

      if (existingReport) {
        await api.updateDailyReport(auth, userId, today, reportData);
      } else {
        await api.saveDailyReport(auth, userId, reportData);
      }

      console.log('Study session saved successfully:', reportData);
      alert(`学習セッションを保存しました！\n学習時間: ${formatTime(studyTime)}\n集中時間: ${formatTime(totalFocusTime)}`);

    } catch (error) {
      console.error('Error saving report:', error);
      alert('学習データの保存に失敗しました。もう一度お試しください。');
    }

    // Reset counters
    setStudyTime(0);
    setInterruptionCount(0);
    setPomodoroTime(WORK_DURATION);
    setIsBreak(false);
    setCurrentCycle(1);
  }, [studyTime, interruptionCount, currentFocusScore, user]);

  const playNotificationSound = () => {
    // publicフォルダに置いたファイルへのパスを指定
    const audio = new Audio('/notification.mp3'); 
    audio.play();
  };

  // ポモドーロタイマーのサイクル遷移ロジック
  useEffect(() => {
    if (isStudying && pomodoroTime <= 0) {
      // 通知音を再生
      playNotificationSound();
      
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


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Controls and Stats */}
        <div className="space-y-6">
          {/* Study Controls */}
          <Card className="bg-card border dark:border-white">
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
                      className="h-15 w-15 p-0 text-card-foreground border dark:border-white hover:bg-accent text-2xl"
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
                      className="h-15 w-15 p-0 text-card-foreground border dark:border-white hover:bg-accent text-2xl"
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
          <Card className="bg-card border dark:border-white">
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
                  {isBreak ? '🛌 休憩時間' : '📚 集中時間'}
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
          <Card className="bg-card border dark:border-white">
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

          {/* Selected Task */}
          {selectedTask && (
            <Card className="bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30 dark:border-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-card-foreground flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  選択中のタスク
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-card/50 p-3 rounded-lg">
                  <div className="font-semibold text-foreground text-lg">第{selectedTask.day}日目</div>
                  <div className="text-foreground font-medium">{selectedTask.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{selectedTask.curriculumTitle}</div>
                </div>
                {selectedTask.objectives && (
                  <div className="bg-card/30 p-3 rounded-lg">
                    <div className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      今日の目標
                    </div>
                    <ul className="text-sm text-card-foreground space-y-1.5">
                      {selectedTask.objectives.slice(0, 2).map((obj, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary mt-1">▸</span>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={async () => {
                      try {
                        await api.updateCurriculumProgress(auth, selectedTask.curriculumId, selectedTask.day, { completed: true });
                        localStorage.removeItem('selectedTask');
                        setSelectedTask(null);
                        alert('🎉 タスクを完了しました！');
                      } catch (error) {
                        console.error('Error completing task:', error);
                        alert('タスクの完了に失敗しました');
                      }
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    ✓ 完了
                  </Button>
                  <Button
                    onClick={() => {
                      localStorage.removeItem('selectedTask');
                      setSelectedTask(null);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1 border dark:border-white"
                  >
                    クリア
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}


        </div>

        {/* Center - Camera Feed */}
        <div className="space-y-6">
          <FocusMonitor
            enabled={cameraEnabled}
            onFocusScoreUpdate={handleFocusScoreUpdate}
          />
          
          {/* Real-time Stats */}
          <Card className="bg-card border dark:border-white">
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

        {/* Right Sidebar - Learning Activities */}
        <div>
          {selectedTask ? (
            <Card className="bg-card border dark:border-white">
              <CardHeader>
                <CardTitle className="text-card-foreground flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  学習活動チェックリスト
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4 p-2 bg-muted/50 rounded">
                  第{selectedTask.day}日目: {selectedTask.title}
                </div>
                {selectedTask.activities?.map((activity, index) => {
                  const checkKey = `${selectedTask.curriculumId}-${selectedTask.day}-${index}`;
                  const isChecked = activityChecklist[checkKey] || false;

                  return (
                    <div key={index} className="bg-muted/30 p-3 rounded-lg border">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleActivityCheck(index, e.target.checked)}
                          className="mt-1 w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className={`font-medium ${isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {activity.title}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {activity.duration_minutes}分
                            </Badge>
                          </div>
                          <p className={`text-sm ${isChecked ? 'line-through text-muted-foreground/70' : 'text-muted-foreground'}`}>
                            {activity.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {selectedTask.activities?.length > 0 && (() => {
                  const completedCount = selectedTask.activities.filter((_, index) => {
                    const checkKey = `${selectedTask.curriculumId}-${selectedTask.day}-${index}`;
                    return activityChecklist[checkKey];
                  }).length;
                  const totalCount = selectedTask.activities.length;
                  const isAllCompleted = completedCount === totalCount;

                  return (
                    <div className="pt-2 border-t border-border space-y-3">
                      <div className="text-sm text-muted-foreground">
                        進捗: {completedCount} / {totalCount}
                      </div>
                      <Progress
                        value={(completedCount / totalCount) * 100}
                        className="w-full"
                      />
                      {isAllCompleted && (
                        <Button
                          onClick={async () => {
                            try {
                              await api.updateCurriculumProgress(auth, selectedTask.curriculumId, selectedTask.day, { completed: true });
                              localStorage.removeItem('selectedTask');
                              // チェックリストもクリア
                              const newChecklist = { ...activityChecklist };
                              selectedTask.activities.forEach((_, index) => {
                                delete newChecklist[`${selectedTask.curriculumId}-${selectedTask.day}-${index}`];
                              });
                              setActivityChecklist(newChecklist);
                              localStorage.setItem('activityChecklist', JSON.stringify(newChecklist));
                              setSelectedTask(null);
                              alert('🎉 全ての学習活動を完了しました！タスクを完了します。');
                            } catch (error) {
                              console.error('Error completing task:', error);
                              alert('タスクの完了に失敗しました');
                            }
                          }}
                          className="w-full bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          🎉 全ての活動を完了！
                        </Button>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border dark:border-white">
              <CardContent className="p-6 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">タスクが選択されていません</p>
                <p className="text-muted-foreground/70 text-sm">カリキュラムからタスクを選択してください</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
