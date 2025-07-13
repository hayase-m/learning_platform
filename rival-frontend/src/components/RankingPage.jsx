import { api } from '../api';
import { auth } from '../firebase';
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Trophy, Clock, Target, Medal, Award } from 'lucide-react'

export default function RankingPage({ user, onBack }) {
  const [studyTimeRanking, setStudyTimeRanking] = useState([])
  const [focusTimeRanking, setFocusTimeRanking] = useState([])
  const [todayStudyTimeRanking, setTodayStudyTimeRanking] = useState([])
  const [todayFocusTimeRanking, setTodayFocusTimeRanking] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const [totalStudy, totalFocus, todayStudy, todayFocus] = await Promise.all([
        api.fetchTotalStudyTimeRanking(auth),
        api.fetchTotalFocusTimeRanking(auth),
        api.fetchTodayStudyTimeRanking(auth),
        api.fetchTodayFocusTimeRanking(auth)
      ]);
      setStudyTimeRanking(totalStudy);
      setFocusTimeRanking(totalFocus);
      setTodayStudyTimeRanking(todayStudy);
      setTodayFocusTimeRanking(todayFocus);
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}時間${minutes}分`;
    }
    return `${minutes}分`;
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-muted-foreground font-bold">{rank}</span>;
    }
  };

  const RankingList = ({ rankings, timeKey, title, icon }) => (
    <Card className="bg-card border">
      <CardHeader>
        <CardTitle className="text-card-foreground flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="text-foreground">ランキングを読み込み中...</div>
          </div>
        ) : rankings.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">データがありません</div>
          </div>
        ) : (
          <div className="space-y-3">
            {rankings.map((item) => (
              <div
                key={item.user_id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  item.user_id === (user?.uid || 'sample_user_123')
                    ? 'bg-primary/20 border border-primary/50'
                    : 'bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getRankIcon(item.rank)}
                  <div>
                    <div className="font-medium text-foreground">
                      {item.name}
                      {item.user_id === (user?.uid || 'sample_user_123') && (
                        <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                          あなた
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground">
                    {formatTime(item[timeKey])}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.rank}位
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

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
          ランキング
        </h1>
      </div>

      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="study-time-total" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="study-time-total">総学習時間</TabsTrigger>
            <TabsTrigger value="focus-time-total">総集中時間</TabsTrigger>
            <TabsTrigger value="study-time-today">今日の学習</TabsTrigger>
            <TabsTrigger value="focus-time-today">今日の集中</TabsTrigger>
          </TabsList>
          
          <TabsContent value="study-time-total" className="mt-6">
            <RankingList
              rankings={studyTimeRanking}
              timeKey="total_study_time"
              title="総学習時間ランキング"
              icon={<Clock className="w-5 h-5" />}
            />
          </TabsContent>
          
          <TabsContent value="focus-time-total" className="mt-6">
            <RankingList
              rankings={focusTimeRanking}
              timeKey="total_focus_time"
              title="総集中時間ランキング"
              icon={<Target className="w-5 h-5" />}
            />
          </TabsContent>
          
          <TabsContent value="study-time-today" className="mt-6">
            <RankingList
              rankings={todayStudyTimeRanking}
              timeKey="total_study_time"
              title="今日の学習時間ランキング"
              icon={<Clock className="w-5 h-5" />}
            />
          </TabsContent>
          
          <TabsContent value="focus-time-today" className="mt-6">
            <RankingList
              rankings={todayFocusTimeRanking}
              timeKey="total_focus_time"
              title="今日の集中時間ランキング"
              icon={<Target className="w-5 h-5" />}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}