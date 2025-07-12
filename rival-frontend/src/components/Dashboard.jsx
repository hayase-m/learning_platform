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
import { api } from '../api'
import { auth } from '../firebase'

const WORK_DURATION = 25 * 60; // 25 minutes in seconds
const BREAK_DURATION = 5 * 60; // 5 minutes in seconds

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate()
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
              {!isStudying && (
                <div className="space-y-2">
                  <Label htmlFor="cycles" className="text-white flex items-center gap-2">
                    <Repeat className="w-4 h-4" />
                    サイクル数
                  </Label>
                  <Input
                    id="cycles"
                    type="number"
                    value={targetCycles}
                    onChange={(e) => setTargetCycles(Math.max(parseInt(e.target.value, 10) || 1, 1))}
                    min="1"
                    className="bg-white/10 border-white/20 text-white"
                    disabled={isStudying}
                  />
                </div>
              )}
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
                学習タイマー
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
                  value={isBreak ? ((BREAK_DURATION - pomodoroTime) / BREAK_DURATION) * 100 : ((WORK_DURATION - pomodoroTime) / WORK_DURATION) * 100}
                  className="w-full"
                />
                {isStudying && (
                  <div className="text-sm text-white/70 mt-2">
                    サイクル: {currentCycle} / {targetCycles}
                  </div>
                )}
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

          {/* Selected Task */}
          {selectedTask && (
            <Card className="bg-blue-500/20 backdrop-blur-md border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  選択中のタスク
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-white">
                  <div className="font-medium">第{selectedTask.day}日目: {selectedTask.title}</div>
                  <div className="text-sm text-white/70 mt-1">{selectedTask.curriculumTitle}</div>
                </div>
                {selectedTask.objectives && (
                  <div>
                    <div className="text-sm font-medium text-white mb-1">今日の目標:</div>
                    <ul className="text-sm text-white/80 space-y-1">
                      {selectedTask.objectives.slice(0, 2).map((obj, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-blue-400">•</span>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex gap-2">
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
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    完了
                  </Button>
                  <Button
                    onClick={() => {
                      localStorage.removeItem('selectedTask');
                      setSelectedTask(null);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-white border-white/20 hover:bg-white/10"
                  >
                    クリア
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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

        {/* Right Sidebar - Learning Activities */}
        <div>
          {selectedTask ? (
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  学習活動チェックリスト
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-white/70 mb-4">
                  第{selectedTask.day}日目: {selectedTask.title}
                </div>
                {selectedTask.activities?.map((activity, index) => {
                  const checkKey = `${selectedTask.curriculumId}-${selectedTask.day}-${index}`;
                  const isChecked = activityChecklist[checkKey] || false;
                  
                  return (
                    <div key={index} className="bg-white/5 p-3 rounded-lg space-y-2">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleActivityCheck(index, e.target.checked)}
                          className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4" />
                            <span className={`font-medium ${isChecked ? 'line-through text-white/50' : 'text-white'}`}>
                              {activity.title}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {activity.duration_minutes}分
                            </Badge>
                          </div>
                          <p className={`text-sm ${isChecked ? 'line-through text-white/30' : 'text-white/70'}`}>
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
                    <div className="pt-2 border-t border-white/10 space-y-3">
                      <div className="text-sm text-white/70">
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
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
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
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-6 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-white/50" />
                <p className="text-white/70">タスクが選択されていません</p>
                <p className="text-white/50 text-sm">カリキュラムからタスクを選択してください</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
