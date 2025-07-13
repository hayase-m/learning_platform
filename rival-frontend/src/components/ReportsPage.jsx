import { api } from '../api';
import { auth } from '../firebase';
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Calendar as CalendarIcon, Clock, Target, AlertTriangle, Plus, Trash2 } from 'lucide-react'

export default function ReportsPage({ user, onBack }) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    const userId = user?.uid || 'sample_user_123';
    fetchReport(selectedDate, userId);
  }, [selectedDate, user]);

  const fetchReport = async (date, userId) => {
    setLoading(true);
    const dateString = formatDate(date);

    setReportData(null);
    setComments([]);

    try {
      const data = await api.fetchUserReports(auth, userId, dateString);
      if (data) {
        setReportData(data);
      }

      const commentsData = await api.fetchDailyComments(auth, userId, dateString);
      setComments(commentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setReportData(null);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      const userId = user?.uid || 'sample_user_123';
      const dateString = formatDate(selectedDate);
      const comment = await api.createComment(auth, userId, {
        date: dateString,
        comment_text: newComment
      });
      setComments([comment, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('コメントの追加に失敗しました。');
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await api.deleteComment(auth, commentId);
      setComments(comments.filter(c => c.comment_id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('コメントの削除に失敗しました。');
    }
  };

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
                  <CardTitle className="text-card-foreground">コメント</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="コメントを追加..."
                      className="bg-card border text-card-foreground placeholder:text-muted-foreground min-h-16"
                    />
                    <Button
                      onClick={addComment}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {comments.map((comment) => (
                      <div key={comment.comment_id} className="bg-muted/30 p-3 rounded-lg flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-card-foreground">{comment.comment_text}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(comment.created_at).toLocaleString('ja-JP')}
                          </p>
                        </div>
                        <Button
                          onClick={() => deleteComment(comment.comment_id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
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
                  <CardTitle className="text-card-foreground">コメント</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="コメントを追加..."
                      className="bg-card border text-card-foreground placeholder:text-muted-foreground min-h-16"
                    />
                    <Button
                      onClick={addComment}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {comments.map((comment) => (
                      <div key={comment.comment_id} className="bg-muted/30 p-3 rounded-lg flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-card-foreground">{comment.comment_text}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(comment.created_at).toLocaleString('ja-JP')}
                          </p>
                        </div>
                        <Button
                          onClick={() => deleteComment(comment.comment_id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
