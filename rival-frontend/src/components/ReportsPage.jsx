import { api } from '../api';
import { auth } from '../firebase';
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Calendar as CalendarIcon, Clock, Target, AlertTriangle } from 'lucide-react'

export default function ReportsPage({ user, onBack }) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [reportData, setReportData] = useState(null)
  const [userNotes, setUserNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const userId = user?.uid || 'sample_user_123';
    fetchReport(selectedDate, userId);
  }, [selectedDate, user]);

  const fetchReport = async (date, userId) => {
    setLoading(true);
    const dateString = date.toISOString().split('T')[0];
    console.log('Fetching report for:', dateString, 'userId:', userId);
    
    try {
      const data = await api.fetchUserReports(auth, userId, dateString);
      console.log('Report data received:', data);
      if (data) {
        setReportData(data);
        setUserNotes(data.user_notes || '');
      } else {
        console.log('No report data found for date:', dateString);
        setReportData(null);
        setUserNotes('');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      setReportData(null);
      setUserNotes('');
    } finally {
      setLoading(false);
    }
  };

  const saveUserNotes = async () => {
    if (!reportData) return
    
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const userId = user?.uid || 'sample_user_123';
      await api.updateDailyReport(auth, userId, dateString, {
        ...reportData,
        user_notes: userNotes,
      });
    } catch (error) {
      console.error('Error saving notes:', error);
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
          ダッシュボードに戻る
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          学習レポート
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-card border">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                日付選択
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
                className="text-card-foreground"
                classNames={{
                  day_selected: "bg-purple-600 text-card-foreground",
                  day_today: "bg-purple-400/50 text-card-foreground",
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <Card className="bg-card border">
              <CardContent className="p-8 text-center">
                <div className="text-foreground">レポートを読み込み中...</div>
              </CardContent>
            </Card>
          ) : reportData ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-card border">
                  <CardContent className="p-4 text-center">
                    <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">
                      {formatTime(reportData.total_study_time)}
                    </div>
                    <div className="text-sm text-muted-foreground">総学習時間</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-card border">
                  <CardContent className="p-4 text-center">
                    <Target className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">
                      {formatTime(reportData.total_focus_time)}
                    </div>
                    <div className="text-sm text-muted-foreground">集中時間</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-card border">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {Math.round(reportData.avg_focus_score)}
                    </div>
                    <div className="text-sm text-muted-foreground">平均集中スコア</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-card border">
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">
                      {reportData.interruption_count}
                    </div>
                    <div className="text-sm text-muted-foreground">中断回数</div>
                  </CardContent>
                </Card>
              </div>



              {/* AI Summary */}
              <Card className="bg-card border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">AIライバルからの総評</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-card-foreground leading-relaxed">
                      {reportData.ai_summary}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* User Notes */}
              <Card className="bg-card border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">メモ・振り返り</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    placeholder="今日の学習について振り返りや明日の目標を記入してください..."
                    className="bg-card border text-card-foreground placeholder:text-muted-foreground min-h-24"
                  />
                  <Button
                    onClick={saveUserNotes}
                    className="bg-primary hover:bg-primary/90 text-card-foreground"
                  >
                    メモを保存
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-card border">
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground mb-4">
                  選択した日付のレポートがありません
                </div>
                <div className="text-sm text-muted-foreground">
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

