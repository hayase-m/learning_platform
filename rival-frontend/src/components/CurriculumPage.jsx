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
  RotateCcw
} from 'lucide-react'

export default function CurriculumPage({ user, onBack }) {
  const [activeTab, setActiveTab] = useState('create')
  const [curriculums, setCurriculums] = useState([])
  const [selectedCurriculum, setSelectedCurriculum] = useState(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    goal: '',
    duration_days: 30
  })

  useEffect(() => {
    // ユーザー情報が利用可能になってからカリキュラムを取得
    if (user && user.uid) {
      fetchCurriculums(user.uid);
    }
  }, [user]); // userオブジェクトの変更を監視

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
      const response = await fetch(`${API_BASE_URL}/curriculums/${curriculumId}/progress`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
    return [];
  };

  // 統計情報を取得
  const fetchStats = async (curriculumId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/curriculums/${curriculumId}/stats`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
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

    try {
      const newCurriculum = await api.createCurriculum(auth, user.uid, formData);
      setCurriculums(prev => [newCurriculum, ...prev]);
      setFormData({ goal: '', duration_days: 30 });
      setActiveTab('list');
    } catch (error) {
      console.error('Error creating curriculum:', error);
      alert(`カリキュラムの生成に失敗しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // 日別タスクの完了状態を更新
  const handleToggleCompletion = async (curriculumId, day, completed) => {
    try {
      const response = await fetch(`${API_BASE_URL}/curriculums/${curriculumId}/progress/${day}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !completed } ),
      })

      if (response.ok) {
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
    setActiveTab('view')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ja-JP')
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="text-foreground border hover:bg-accent"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          <BookOpen className="w-6 h-6 inline mr-2" />
          学習カリキュラム
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card border">
          <TabsTrigger value="create" className="text-foreground data-[state=active]:bg-white/20">
            <Plus className="w-4 h-4 mr-2" />
            新規作成
          </TabsTrigger>
          <TabsTrigger value="list" className="text-foreground data-[state=active]:bg-white/20">
            <BookOpen className="w-4 h-4 mr-2" />
            カリキュラム一覧
          </TabsTrigger>
          <TabsTrigger value="view" className="text-foreground data-[state=active]:bg-white/20" disabled={!selectedCurriculum}>
            <Target className="w-4 h-4 mr-2" />
            詳細表示
          </TabsTrigger>
        </TabsList>

        {/* カリキュラム作成タブ */}
        <TabsContent value="create" className="space-y-6">
          <Card className="bg-card border border">
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
                    className="bg-white/10 border text-foreground placeholder:text-foreground/50"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-foreground">学習期間（日数）</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="7"
                    max="60"
                    value={formData.duration_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value) }))}
                    required
                    className="bg-white/10 border text-foreground"
                  />
                  <p className="text-sm text-foreground/70">7日から60日まで設定できます</p>
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
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* カリキュラム一覧タブ */}
        <TabsContent value="list" className="space-y-6">
          <div className="grid gap-4">
            {curriculums.length === 0 ? (
              <Card className="bg-card border border">
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-foreground/50" />
                  <p className="text-foreground/70">まだカリキュラムがありません</p>
                  <p className="text-foreground/50 text-sm">「新規作成」タブから最初のカリキュラムを作成しましょう</p>
                </CardContent>
              </Card>
            ) : (
              curriculums.map((curriculum) => (
                <Card key={curriculum.curriculum_id} className="bg-card border border">
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
                      <Button
                        onClick={() => handleViewCurriculum(curriculum)}
                        variant="outline"
                        size="sm"
                        className="text-foreground border hover:bg-accent"
                      >
                        詳細を見る
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* カリキュラム詳細タブ */}
        <TabsContent value="view" className="space-y-6">
          {selectedCurriculum && (
            <>
              {/* カリキュラム概要 */}
              <Card className="bg-card border border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    {selectedCurriculum.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-foreground/90">{selectedCurriculum.overview}</p>
                  
                  {/* 進捗統計 */}
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

                  {/* 進捗バー */}
                  {selectedCurriculum.stats && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-foreground/70">
                        <span>進捗</span>
                        <span>{selectedCurriculum.stats.completion_rate}%</span>
                      </div>
                      <Progress value={selectedCurriculum.stats.completion_rate} className="w-full" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 日別カリキュラム */}
              <Card className="bg-card border border">
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
                          <AccordionTrigger className="text-foreground hover:text-foreground/80">
                            <div className="flex items-center gap-3 w-full">
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
                                  <Circle className="w-5 h-5 text-foreground/50" />
                                )}
                              </Button>
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
                            {/* 学習目標 */}
                            <div>
                              <h4 className="font-medium text-foreground mb-2">学習目標</h4>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                {plan.objectives?.map((objective, index) => (
                                  <li key={index}>{objective}</li>
                                ))}
                              </ul>
                            </div>

                            {/* 学習トピック */}
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

                            {/* 学習活動 */}
                            <div>
                              <h4 className="font-medium text-foreground mb-2">学習活動</h4>
                              <div className="space-y-2">
                                {plan.activities?.map((activity, index) => (
                                  <div key={index} className="bg-white/5 p-3 rounded-lg">
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

                            {/* リソース */}
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

                            {/* 評価・宿題 */}
                            <div className="grid md:grid-cols-2 gap-4">
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

              {/* マイルストーン */}
              {selectedCurriculum.curriculum_data.milestones && selectedCurriculum.curriculum_data.milestones.length > 0 && (
                <Card className="bg-card border border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      マイルストーン
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedCurriculum.curriculum_data.milestones.map((milestone, index) => (
                        <div key={index} className="bg-white/5 p-4 rounded-lg">
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
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
