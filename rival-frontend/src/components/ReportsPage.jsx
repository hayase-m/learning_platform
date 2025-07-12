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

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    const userId = user?.uid || 'sample_user_123';
    const dateKey = formatDate(selectedDate);
    console.log('Date changed to:', dateKey);
    fetchReport(selectedDate, userId);
  }, [selectedDate, user]);

  const fetchReport = async (date, userId) => {
    setLoading(true);
    const dateString = formatDate(date);
    console.log('Fetching report for date:', dateString, 'userId:', userId);
    
    // 状態をリセット
    setReportData(null);
    setUserNotes('');
    
    try {
      const data = await api.fetchUserReports(auth, userId, dateString);
      console.log('API response:', data);
      if (data) {
        console.log('Setting report data:', data);
        setReportData(data);
        setUserNotes(data.user_notes || '');
      } else {
        console.log('No data found for date:', dateString);
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
    try {
      const dateString = formatDate(selectedDate);
      const userId = user?.uid || 'sample_user_123';
      
      if (reportData) {
        await api.updateDailyReport(auth, userId, dateString, {
          ...reportData,
          user_notes: userNotes,
        });
      } else {
        const newReport = {
          date: dateString,
          total_study_time: 0,
          total_focus_time: 0,
          avg_focus_score: 0,
          interruption_count: 0,
          ai_summary: '',
          user_notes: userNotes
        };
        await api.saveDailyReport(auth, userId, newReport);
        setReportData(newReport);
      }
      alert('メモを保存しました！');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('メモの保存に失敗しました。');
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
                disableUnselect
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(new Date(date))}
                className="text-card-foreground"
                classNames={{
                  day_selected: "bg-purple-600 text-card-foreground",
                  day_today: "bg-purple-400/50 text-card-foreground",
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <Card className="bg-card border">
              <CardContent className="p-8 text-center">
                <div className="text-foreground">レポートを読み込み中...</div>
              </CardContent>
            </Card>
          ) : reportData ? (
            <>
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
            <>
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
          )}
        </div>
      </div>
    </div>
  )
}
