import { api } from '../api';
import { auth } from '../firebase';
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  ArrowLeft,
  Target,
  Calendar,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Trophy,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  PartyPopper,
  Play
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import CurriculumRadialMap from './CurriculumRadialMap'

export default function CurriculumPage({ user }) {
  const [activeTab, setActiveTab] = useState('create')
  const [curriculums, setCurriculums] = useState([])
  const [selectedCurriculum, setSelectedCurriculum] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generationStatus, setGenerationStatus] = useState(null)
  const [formData, setFormData] = useState({
    goal: '',
    duration_days: 30
  })

  useEffect(() => {
    if (user && user.uid) {
      fetchCurriculums(user.uid);
      checkGenerationStatus();
    }
    
    const intervalId = setInterval(() => {
      const status = localStorage.getItem('curriculumGenerationStatus');
      if (status && user && user.uid) {
        const parsedStatus = JSON.parse(status);
        if (parsedStatus.isGenerating) {
          if (!loading) {
            setLoading(true);
            setGenerationStatus(parsedStatus);
          }
          pollGenerationStatus(parsedStatus.userId, parsedStatus.startTime);
        }
      }
    }, 3000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [user, loading]);

  const checkGenerationStatus = () => {
    const status = localStorage.getItem('curriculumGenerationStatus');
    if (status) {
      const parsedStatus = JSON.parse(status);
      if (parsedStatus.isGenerating) {
        setGenerationStatus(parsedStatus);
        setLoading(true);
        pollGenerationStatus(parsedStatus.userId, parsedStatus.startTime);
      }
    }
  };

  const pollGenerationStatus = async (userId, startTime) => {
    const maxWaitTime = 5 * 60 * 1000;
    const currentTime = Date.now();
    
    if (currentTime - startTime > maxWaitTime) {
      clearGenerationStatus();
      setLoading(false);
      alert('カリキュラム生成がタイムアウトしました。もう一度お試しください。');
      return;
    }

    try {
      const data = await api.fetchCurriculums(auth, userId);
      const newCurriculum = data.find(c => {
        const createdTime = new Date(c.created_at).getTime();
        return createdTime >= startTime - 1000;
      });
      
      if (newCurriculum) {
        setCurriculums(data);
        clearGenerationStatus();
        setLoading(false);
        setFormData({ goal: '', duration_days: 30 });
        setActiveTab('list');
        alert(`カリキュラム「${newCurriculum.title}」が正常に生成されました！`);
      }
    } catch (error) {
      console.error('Error polling generation status:', error);
    }
  };

  const clearGenerationStatus = () => {
    localStorage.removeItem('curriculumGenerationStatus');
    setGenerationStatus(null);
  };

  // カリキュラム一覧を取得
  const fetchCurriculums = async (userId) => {
    try {
      const data = await api.fetchCurriculums(auth, userId);
      setCurriculums(data);
    } catch (error) {
      console.error('Error fetching curriculums:', error);
    }
  };

  // 進捗情報を取得
  const fetchProgress = async (curriculumId) => {
    try {
      const data = await api.fetchCurriculumProgress(auth, curriculumId);
      return data;
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
    return [];
  };

  // 統計情報を取得
  const fetchStats = async (curriculumId) => {
    try {
      const data = await api.fetchCurriculumStats(auth, curriculumId);
      return data;
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
    return null;
  };

  // カリキュラム生成
  const handleCreateCurriculum = async (e) => {
    e.preventDefault();
    if (!user || !user.uid) return;

    setLoading(true);
    const startTime = Date.now();
    
    const status = {
      isGenerating: true,
      userId: user.uid,
      startTime: startTime,
      goal: formData.goal
    };
    localStorage.setItem('curriculumGenerationStatus', JSON.stringify(status));
    setGenerationStatus(status);

    try {
      const newCurriculum = await api.createCurriculum(auth, user.uid, formData);
      setCurriculums(prev => [newCurriculum, ...prev]);
      setFormData({ goal: '', duration_days: 30 });
      clearGenerationStatus();
      setLoading(false);
      setActiveTab('list');
      alert(`カリキュラム「${newCurriculum.title}」が正常に生成されました！`);
    } catch (error) {
      console.error('Error creating curriculum:', error);
      pollGenerationStatus(user.uid, startTime);
    }
  }

  // 日別タスクの完了状態を更新
  const handleToggleCompletion = async (curriculumId, day, completed) => {
    try {
      await api.updateCurriculumProgress(auth, curriculumId, day, { completed: !completed });

      // 選択されたカリキュラムの進捗を更新
      if (selectedCurriculum && selectedCurriculum.curriculum_id === curriculumId) {
        const updatedProgress = await fetchProgress(curriculumId)
        const updatedStats = await fetchStats(curriculumId)
        setSelectedCurriculum(prev => ({
          ...prev,
          progress: updatedProgress,
          stats: updatedStats
        }))
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  // カリキュラム詳細を表示
  const handleViewCurriculum = async (curriculum) => {
    const progress = await fetchProgress(curriculum.curriculum_id)
    const stats = await fetchStats(curriculum.curriculum_id)

    setSelectedCurriculum({
      ...curriculum,
      progress: progress,
      stats: stats
    })
  }

  // カリキュラム削除
  const handleDeleteCurriculum = async (curriculumId) => {
    if (!confirm('このカリキュラムを削除しますか？この操作は取り消せません。')) return;

    try {
      await api.deleteCurriculum(auth, curriculumId);
      setCurriculums(prev => prev.filter(c => c.curriculum_id !== curriculumId));
      if (selectedCurriculum?.curriculum_id === curriculumId) {
        setSelectedCurriculum(null);
        setActiveTab('list');
      }
    } catch (error) {
      console.error('Error deleting curriculum:', error);
      alert('カリキュラムの削除に失敗しました');
    }
  }

  // カリキュラム完了
  const handleCompleteCurriculum = () => {
    alert('🎉 おめでとうございます！カリキュラムを完了しました！');
    setSelectedCurriculum(null);
  }

  // タスク選択
  const handleSelectTask = (curriculum, plan) => {
    const selectedTask = {
      curriculumId: curriculum.curriculum_id,
      curriculumTitle: curriculum.title,
      day: plan.day,
      title: plan.title,
      objectives: plan.objectives,
      activities: plan.activities,
      selectedAt: new Date().toISOString()
    };
    localStorage.setItem('selectedTask', JSON.stringify(selectedTask));
    alert(`第${plan.day}日目のタスクを選択しました: ${plan.title}`);
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ja-JP')
  }

  return (
    <div className="min-h-screen bg-background p-4">


      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card border">
          <TabsTrigger value="create" className="text-foreground data-[state=active]:bg-accent">
            <Plus className="w-4 h-4 mr-2" />
            新規作成
          </TabsTrigger>
          <TabsTrigger value="list" className="text-foreground data-[state=active]:bg-accent">
            <BookOpen className="w-4 h-4 mr-2" />
            カリキュラム一覧
          </TabsTrigger>
        </TabsList>

        {/* カリキュラム作成タブ */}
        <TabsContent value="create" className="space-y-6">
          <Card className="bg-card border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Target className="w-5 h-5" />
                新しいカリキュラムを作成
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCurriculum} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="goal" className="text-foreground">学習目標</Label>
                  <Textarea
                    id="goal"
                    placeholder="例: React.jsとNode.jsを使ったフルスタックWeb開発を学ぶ"
                    value={formData.goal}
                    onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                    required
                    className="bg-card border text-foreground placeholder:text-foreground/50"
                    rows={3}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="duration" className="text-foreground font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    学習期間
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, duration_days: Math.max(prev.duration_days - 1, 1) }))}
                      className="h-16 w-16 p-0 text-foreground border hover:bg-accent text-2xl"
                      disabled={formData.duration_days <= 1}
                    >
                      -
                    </Button>
                    <div className="flex-1 text-center bg-muted/50 rounded-lg p-3">
                      <div className="text-3xl font-bold text-foreground">{formData.duration_days}</div>
                      <div className="text-sm text-muted-foreground">日間</div>
                      <div className="text-xs text-muted-foreground mt-1">約{Math.ceil(formData.duration_days / 7)}週間</div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, duration_days: Math.min(prev.duration_days + 1, 30) }))}
                      className="h-16 w-16 p-0 text-foreground border hover:bg-accent text-2xl"
                      disabled={formData.duration_days >= 30}
                    >
                      +
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[7, 14, 21, 30].map(days => (
                      <Button
                        key={days}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, duration_days: days }))}
                        className={`text-xs ${formData.duration_days === days ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                      >
                        {days}日
                      </Button>
                    ))}
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading || !formData.goal.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-foreground"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      カリキュラム生成中...
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4 mr-2" />
                      カリキュラムを生成
                    </>
                  )}
                </Button>
                
                {loading && generationStatus && (
                  <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      <span className="text-blue-400 font-medium">生成中</span>
                    </div>
                    <p className="text-sm text-foreground/70 mb-2">
                      目標: {generationStatus.goal}
                    </p>
                    <p className="text-xs text-foreground/50">
                      AIがカリキュラムを作成しています。しばらくお待ちください...
                    </p>
                    <p className="text-xs text-foreground/40 mt-2">
                      ※ 他のページに移動しても生成は継続されます
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        onClick={() => {
                          clearGenerationStatus();
                          setLoading(false);
                        }}
                        variant="outline"
                        size="sm"
                        className="text-red-400 border-red-400/20 hover:bg-red-400/10"
                      >
                        キャンセル
                      </Button>
                      <Button
                        onClick={() => user && user.uid && fetchCurriculums(user.uid)}
                        variant="outline"
                        size="sm"
                        className="text-blue-400 border-blue-400/20 hover:bg-blue-400/10"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        状態確認
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* カリキュラム一覧タブ */}
        <TabsContent value="list" className="space-y-6">
          {selectedCurriculum && (
            <div className="mb-6">
              <Button
                onClick={() => setSelectedCurriculum(null)}
                variant="outline"
                size="sm"
                className="mb-4 border"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                一覧に戻る
              </Button>
              {/* 詳細表示内容をここに移動 */}
              {selectedCurriculum.stats?.completion_rate === 100 && (
                <Card className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-md border-green-400/30 mb-6">
                  <CardContent className="p-6 text-center">
                    <PartyPopper className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">🎉 カリキュラム完了！</h3>
                    <p className="text-gray-700 dark:text-white/80 mb-4">すべてのタスクを完了しました。お疲れさまでした！</p>
                    <Button
                      onClick={handleCompleteCurriculum}
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold"
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      完了を確認
                    </Button>
                  </CardContent>
                </Card>
              )}
              <Card className="bg-card border mb-6">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      {selectedCurriculum.title}
                    </div>
                    <Button
                      onClick={() => handleDeleteCurriculum(selectedCurriculum.curriculum_id)}
                      variant="outline"
                      size="sm"
                      className="text-red-400 border-red-400/20 hover:bg-red-400/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      削除
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-foreground/90">{selectedCurriculum.overview}</p>
                  {selectedCurriculum.stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">{selectedCurriculum.stats.total_days}</div>
                        <div className="text-sm text-foreground/70">総日数</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{selectedCurriculum.stats.completed_days}</div>
                        <div className="text-sm text-foreground/70">完了日数</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">{selectedCurriculum.stats.remaining_days}</div>
                        <div className="text-sm text-foreground/70">残り日数</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">{selectedCurriculum.stats.completion_rate}%</div>
                        <div className="text-sm text-foreground/70">完了率</div>
                      </div>
                    </div>
                  )}
                  {selectedCurriculum.curriculum_data.milestones && selectedCurriculum.curriculum_data.milestones.length > 0 && (
                    <Card className="bg-card border">
                      <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                          <Trophy className="w-5 h-5" />
                          マイルストーン
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedCurriculum.curriculum_data.milestones.map((milestone, index) => (
                            <div key={index} className="bg-muted/50 p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Trophy className="w-4 h-4 text-yellow-400" />
                                <span className="font-medium text-foreground">第{milestone.day}日目: {milestone.title}</span>
                              </div>
                              <p className="text-sm text-foreground/70">{milestone.description}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <CurriculumRadialMap
                    curriculum={selectedCurriculum}
                    progress={selectedCurriculum.progress || []}
                    onProgressUpdate={async () => {
                      const updatedProgress = await fetchProgress(selectedCurriculum.curriculum_id)
                      const updatedStats = await fetchStats(selectedCurriculum.curriculum_id)
                      setSelectedCurriculum(prev => ({
                        ...prev,
                        progress: updatedProgress,
                        stats: updatedStats
                      }))
                    }}
                    onDaySelect={setSelectedDay}
                  />
                </CardContent>
              </Card>
              <Card className="bg-card border mb-6">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    日別カリキュラム
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {selectedCurriculum.curriculum_data.daily_plan?.map((plan) => {
                      const progress = selectedCurriculum.progress?.find(p => p.day === plan.day)
                      const isCompleted = progress?.completed || false
                      return (
                        <AccordionItem key={plan.day} value={`day-${plan.day}`}>
                          <AccordionTrigger className={`text-foreground hover:text-foreground/80 ${selectedDay === plan.day ? 'bg-primary/20 border-l-4 border-primary' : ''}`}>
                            <div className="flex items-center gap-3 w-full">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleToggleCompletion(selectedCurriculum.curriculum_id, plan.day, isCompleted)
                                  }}
                                  className="p-1 h-auto"
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-white/50" />
                                  )}
                                </Button>
                                {!isCompleted && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleSelectTask(selectedCurriculum, plan)
                                    }}
                                    className="p-1 h-auto text-blue-400 hover:text-blue-300"
                                  >
                                    <Play className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                              <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">第{plan.day}日目</span>
                                  {isCompleted && <Badge variant="default" className="text-xs">完了</Badge>}
                                </div>
                                <div className="text-sm text-foreground/70">{plan.title}</div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-foreground/90 space-y-4">
                            <div>
                              <h4 className="font-medium text-foreground mb-2">学習目標</h4>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                {plan.objectives?.map((objective, index) => (
                                  <li key={index}>{objective}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground mb-2">学習トピック</h4>
                              <div className="flex flex-wrap gap-2">
                                {plan.topics?.map((topic, index) => (
                                  <Badge key={index} variant="outline" className="text-foreground border">
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground mb-2">学習活動</h4>
                              <div className="space-y-2">
                                {plan.activities?.map((activity, index) => (
                                  <div key={index} className="bg-muted/50 p-3 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Clock className="w-4 h-4" />
                                      <span className="font-medium">{activity.title}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {activity.duration_minutes}分
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-foreground/70">{activity.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {plan.resources && plan.resources.length > 0 && (
                              <div>
                                <h4 className="font-medium text-foreground mb-2">参考リソース</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                  {plan.resources.map((resource, index) => (
                                    <li key={index}>{resource}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div className="grid gap-4">
                              <div>
                                <h4 className="font-medium text-foreground mb-2">評価方法</h4>
                                <p className="text-sm text-foreground/70">{plan.assessment}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-foreground mb-2">宿題</h4>
                                <p className="text-sm text-foreground/70">{plan.homework}</p>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                </CardContent>
              </Card>


            </div>
          )}
          {!selectedCurriculum && (
            <div className="grid gap-4">
              {curriculums.length === 0 ? (
                <Card className="bg-card border">
                  <CardContent className="p-6 text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-foreground/50" />
                    <p className="text-foreground/70">まだカリキュラムがありません</p>
                    <p className="text-foreground/50 text-sm">「新規作成」タブから最初のカリキュラムを作成しましょう</p>
                  </CardContent>
                </Card>
              ) : (
                curriculums.map((curriculum) => (
                  <Card key={curriculum.curriculum_id} className="bg-card border">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-foreground text-lg">{curriculum.title}</CardTitle>
                          <p className="text-foreground/70 text-sm mt-1">{curriculum.goal}</p>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {curriculum.duration_days}日間
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-foreground/70">
                          作成日: {formatDate(curriculum.created_at)}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleViewCurriculum(curriculum)}
                            variant="outline"
                            size="sm"
                            className="text-foreground border hover:bg-accent"
                          >
                            詳細を見る
                          </Button>
                          <Button
                            onClick={() => handleDeleteCurriculum(curriculum.curriculum_id)}
                            variant="outline"
                            size="sm"
                            className="text-red-400 border-red-400/20 hover:bg-red-400/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>


      </Tabs>


    </div>
  )
}
