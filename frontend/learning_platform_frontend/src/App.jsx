import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { BookOpen, Target, Users, CheckCircle } from 'lucide-react'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [goals, setGoals] = useState([])
  const [curriculum, setCurriculum] = useState(null)
  const [progress, setProgress] = useState([])
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [goalForm, setGoalForm] = useState({ title: '', description: '', duration_days: 30 })

  // Mock login function
  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        localStorage.setItem('token', data.access_token)
        fetchGoals()
      } else {
        // For demo purposes, set a mock user
        setUser({
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: loginForm.email,
          role: 'student'
        })
        fetchGoals()
      }
    } catch (error) {
      console.error('Login error:', error)
      // For demo purposes, set a mock user
      setUser({
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: loginForm.email,
        role: 'student'
      })
      fetchGoals()
    }
  }

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals')
      if (response.ok) {
        const data = await response.json()
        setGoals(data)
      }
    } catch (error) {
      console.error('Error fetching goals:', error)
    }
  }

  const createGoal = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalForm)
      })
      
      if (response.ok) {
        const newGoal = await response.json()
        setGoals([...goals, newGoal])
        setGoalForm({ title: '', description: '', duration_days: 30 })
        
        // Generate curriculum for the new goal
        generateCurriculum(newGoal.title, goalForm.duration_days)
      }
    } catch (error) {
      console.error('Error creating goal:', error)
    }
  }

  const generateCurriculum = async (goalTitle, durationDays) => {
    try {
      const response = await fetch('/api/curriculum/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_title: goalTitle, duration_days: durationDays })
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurriculum(data)
      }
    } catch (error) {
      console.error('Error generating curriculum:', error)
    }
  }

  const markLessonComplete = async (lessonId) => {
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId, status: 'completed' })
      })
      
      if (response.ok) {
        const newProgress = await response.json()
        setProgress([...progress, newProgress])
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">学習プラットフォーム</CardTitle>
            <CardDescription className="text-center">
              AIが生成するパーソナライズされた学習体験
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  placeholder="パスワードを入力"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                ログイン
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">学習プラットフォーム</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <Button variant="outline" onClick={() => setUser(null)}>
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">ダッシュボード</TabsTrigger>
            <TabsTrigger value="goals">目標設定</TabsTrigger>
            <TabsTrigger value="curriculum">カリキュラム</TabsTrigger>
            <TabsTrigger value="community">コミュニティ</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">設定済み目標</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{goals.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">完了レッスン</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{progress.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">学習進捗</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {curriculum ? Math.round((progress.length / curriculum.lessons.length) * 100) : 0}%
                  </div>
                  <Progress 
                    value={curriculum ? (progress.length / curriculum.lessons.length) * 100 : 0} 
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>最近の目標</CardTitle>
              </CardHeader>
              <CardContent>
                {goals.length > 0 ? (
                  <div className="space-y-4">
                    {goals.slice(0, 3).map((goal) => (
                      <div key={goal.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <Target className="h-5 w-5 text-blue-500" />
                        <div>
                          <h3 className="font-medium">{goal.title}</h3>
                          <p className="text-sm text-gray-600">{goal.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">まだ目標が設定されていません。目標設定タブから始めましょう。</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>新しい目標を設定</CardTitle>
                <CardDescription>
                  学習目標を設定すると、AIが自動的にカリキュラムを生成します
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createGoal} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">目標タイトル</Label>
                    <Input
                      id="title"
                      value={goalForm.title}
                      onChange={(e) => setGoalForm({...goalForm, title: e.target.value})}
                      placeholder="例: Python プログラミングをマスターする"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">詳細説明</Label>
                    <Input
                      id="description"
                      value={goalForm.description}
                      onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
                      placeholder="目標の詳細を入力してください"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">学習期間（日数）</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={goalForm.duration_days}
                      onChange={(e) => setGoalForm({...goalForm, duration_days: parseInt(e.target.value)})}
                      min="1"
                      max="365"
                    />
                  </div>
                  <Button type="submit">目標を作成</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>設定済みの目標</CardTitle>
              </CardHeader>
              <CardContent>
                {goals.length > 0 ? (
                  <div className="space-y-4">
                    {goals.map((goal) => (
                      <div key={goal.id} className="p-4 border rounded-lg">
                        <h3 className="font-medium">{goal.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          作成日: {new Date(goal.created_at).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">まだ目標が設定されていません。</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="curriculum" className="space-y-6">
            {curriculum ? (
              <Card>
                <CardHeader>
                  <CardTitle>{curriculum.goal_title} - カリキュラム</CardTitle>
                  <CardDescription>
                    {curriculum.duration_days}日間の学習プラン
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {curriculum.lessons.map((lesson) => {
                      const isCompleted = progress.some(p => p.lesson_id === lesson.id && p.status === 'completed')
                      return (
                        <div key={lesson.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">{lesson.day}</span>
                            </div>
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-medium">{lesson.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{lesson.content}</p>
                          </div>
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => markLessonComplete(lesson.id)}
                              >
                                完了
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    カリキュラムを表示するには、まず目標を設定してください。
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>コミュニティ</CardTitle>
                <CardDescription>
                  同じ目標を持つ仲間と一緒に学習しましょう
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    コミュニティ機能は開発中です。近日公開予定！
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default App
