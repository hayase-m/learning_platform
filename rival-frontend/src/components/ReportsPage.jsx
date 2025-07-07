import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Calendar as CalendarIcon, Clock, Target, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function ReportsPage({ user, onBack }) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [reportData, setReportData] = useState(null)
  const [userNotes, setUserNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchReport(selectedDate)
  }, [selectedDate])

  const fetchReport = async (date) => {
    setLoading(true)
    const dateString = date.toISOString().split('T')[0]
    
    try {
      const response = await fetch(`https://g8h3ilc79pek.manus.space/api/users/${user.userId}/reports/${dateString}`)
      
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
        setUserNotes(data.user_notes || '')
      } else {
        setReportData(null)
        setUserNotes('')
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      setReportData(null)
      setUserNotes('')
    } finally {
      setLoading(false)
    }
  }

  const saveUserNotes = async () => {
    if (!reportData) return
    
    try {
      const dateString = selectedDate.toISOString().split('T')[0]
      await fetch(`https://g8h3ilc79pek.manus.space/api/users/${user.userId}/reports/${dateString}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reportData,
          user_notes: userNotes
        }),
      })
    } catch (error) {
      console.error('Error saving notes:', error)
    }
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}時間${minutes}分`
    }
    return `${minutes}分`
  }

  const generateMockTimeSeriesData = () => {
    // Generate mock time series data for demonstration
    const data = []
    for (let hour = 9; hour <= 21; hour++) {
      data.push({
        time: `${hour}:00`,
        score: Math.floor(Math.random() * 40) + 60 // 60-100 range
      })
    }
    return data
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="text-white border-white/20 hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          ダッシュボードに戻る
        </Button>
        <h1 className="text-2xl font-bold text-white">
          学習レポート
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                日付選択
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="text-white"
                classNames={{
                  day_selected: "bg-purple-600 text-white",
                  day_today: "bg-purple-400/50 text-white",
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-8 text-center">
                <div className="text-white">レポートを読み込み中...</div>
              </CardContent>
            </Card>
          ) : reportData ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-4 text-center">
                    <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">
                      {formatTime(reportData.total_study_time)}
                    </div>
                    <div className="text-sm text-slate-300">総学習時間</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-4 text-center">
                    <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">
                      {formatTime(reportData.total_focus_time)}
                    </div>
                    <div className="text-sm text-slate-300">集中時間</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-white">
                      {Math.round(reportData.avg_focus_score)}
                    </div>
                    <div className="text-sm text-slate-300">平均集中スコア</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">
                      {reportData.interruption_count}
                    </div>
                    <div className="text-sm text-slate-300">中断回数</div>
                  </CardContent>
                </Card>
              </div>

              {/* Focus Score Chart */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">時間帯別集中度推移</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={generateMockTimeSeriesData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="time" 
                          stroke="#9CA3AF"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          fontSize={12}
                          domain={[0, 100]}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#8B5CF6" 
                          strokeWidth={2}
                          dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* AI Summary */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">AIライバルからの総評</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <p className="text-white leading-relaxed">
                      {reportData.ai_summary}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* User Notes */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">メモ・振り返り</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    placeholder="今日の学習について振り返りや明日の目標を記入してください..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 min-h-24"
                  />
                  <Button
                    onClick={saveUserNotes}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    メモを保存
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-8 text-center">
                <div className="text-slate-400 mb-4">
                  選択した日付のレポートがありません
                </div>
                <div className="text-sm text-slate-500">
                  学習を開始してデータを蓄積してください
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

