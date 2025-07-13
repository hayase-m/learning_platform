import { API_BASE_URL } from '../config';
import { api } from '../api';
import { auth } from '../firebase';
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeft, Settings, Volume2, Bell, Brain, Gauge, User } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { Input } from '@/components/ui/input'

export default function SettingsPage({ user }) {
  const [settings, setSettings] = useState({
    name: '',
    ai_personality: '厳しい',
    notification_audio: true,
    notification_desktop: false,
    focus_threshold: 70
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user && user.uid) {
      fetchUserSettings(user.uid);
    }
  }, [user]);

  const fetchUserSettings = async (userId) => {
    try {
      console.log('Fetching user settings for userId:', userId);
      const userData = await api.fetchUserSettings(auth, userId);
      console.log('User data received:', userData);
      setSettings({
        name: userData.name || 'ユーザー',
        ai_personality: userData.ai_personality || '厳しい',
        notification_audio: userData.notification_audio !== undefined ? userData.notification_audio : true,
        notification_desktop: userData.notification_desktop !== undefined ? userData.notification_desktop : false,
        focus_threshold: userData.focus_threshold || 70
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      console.error('Error details:', error.message);
      
      // 404エラーの場合はユーザーを作成
      if (error.message.includes('404')) {
        console.log('User not found, creating user...');
        try {
          await api.createUser(auth, userId, user?.email || 'user@example.com', 'ユーザー');
          console.log('User created successfully');
          // 再度設定を取得しようとする
          const userData = await api.fetchUserSettings(auth, userId);
          setSettings({
            name: userData.name || 'ユーザー',
            ai_personality: userData.ai_personality || '厳しい',
            notification_audio: userData.notification_audio !== undefined ? userData.notification_audio : true,
            notification_desktop: userData.notification_desktop !== undefined ? userData.notification_desktop : false,
            focus_threshold: userData.focus_threshold || 70
          });
        } catch (createError) {
          console.error('Error creating user:', createError);
          // ユーザー作成に失敗した場合はデフォルト値を設定
          setSettings({
            name: 'ユーザー',
            ai_personality: '厳しい',
            notification_audio: true,
            notification_desktop: false,
            focus_threshold: 70
          });
        }
      } else {
        // その他のエラーの場合はデフォルト値を設定
        setSettings({
          name: 'ユーザー',
          ai_personality: '厳しい',
          notification_audio: true,
          notification_desktop: false,
          focus_threshold: 70
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    if (!user || !user.uid) {
      console.error('User or user.uid is missing:', user);
      alert('ユーザー情報が取得できません。');
      setSaving(false);
      return;
    }

    try {
      console.log('Saving settings for userId:', user.uid);
      console.log('Settings to save:', settings);
      const result = await api.updateUserSettings(auth, user.uid, settings);
      console.log('Settings saved successfully:', result);
      alert('設定を保存しました！');
    } catch (error) {
      console.error('Error saving settings:', error);
      console.error('Error details:', error.message);
      console.error('User ID:', user.uid);
      alert(`設定の保存に失敗しました: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  const handlePersonalityChange = (value) => {
    setSettings(prev => ({ ...prev, ai_personality: value }))
  }

  const handleNotificationChange = (type, value) => {
    setSettings(prev => ({ ...prev, [type]: value }))
  }

  const handleThresholdChange = (value) => {
    setSettings(prev => ({ ...prev, focus_threshold: value[0] }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-foreground">設定を読み込み中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">


      <div className="max-w-2xl mx-auto space-y-6">
        {/* User Profile Settings */}
        <Card className="bg-card border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <User className="w-5 h-5" />
              ユーザー情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                ユーザー名
              </Label>
              <Input
                id="name"
                type="text"
                value={settings.name}
                onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                className="bg-input border text-foreground"
                placeholder="あなたの名前"
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Personality Settings */}
        <Card className="bg-card border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AIライバルの性格設定
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label className="text-foreground">
              AIライバルの口調を選択してください
            </Label>
            <RadioGroup
              value={settings.ai_personality}
              onValueChange={handlePersonalityChange}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="厳しい" id="strict" />
                <Label htmlFor="strict" className="text-foreground">
                  厳しい - 「集中しろ！」「甘い！」など、厳格で挑戦的な口調
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="論理的" id="logical" />
                <Label htmlFor="logical" className="text-foreground">
                  論理的 - データに基づいた客観的で分析的な口調
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="穏やか" id="gentle" />
                <Label htmlFor="gentle" className="text-foreground">
                  穏やか - 優しく励ましてくれる支援的な口調
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-card border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5" />
              通知設定
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-foreground flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  音声通知
                </Label>
                <p className="text-sm text-muted-foreground">
                  AIからのメッセージを音声で通知します
                </p>
              </div>
              <Switch
                checked={settings.notification_audio}
                onCheckedChange={(value) => handleNotificationChange('notification_audio', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-foreground flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  デスクトップ通知
                </Label>
                <p className="text-sm text-muted-foreground">
                  ブラウザのデスクトップ通知を使用します
                </p>
              </div>
              <Switch
                checked={settings.notification_desktop}
                onCheckedChange={(value) => handleNotificationChange('notification_desktop', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Focus Threshold Settings */}
        <Card className="bg-card border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Gauge className="w-5 h-5" />
              集中度判定の閾値調整
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">
                集中度の判定感度: {settings.focus_threshold}
              </Label>
              <p className="text-sm text-muted-foreground">
                この値以下になると「集中力低下」として判定されます
              </p>
            </div>

            <div className="px-2">
              <Slider
                value={[settings.focus_threshold]}
                onValueChange={handleThresholdChange}
                max={100}
                min={30}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>30 (敏感)</span>
                <span>65 (標準)</span>
                <span>100 (鈍感)</span>
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>推奨設定:</strong> 初回利用時は70前後に設定し、
                使用しながら自分の環境に合わせて調整してください。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Information */}
        <Card className="bg-card border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Settings className="w-5 h-5" />
              プライバシー情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-green-500/20 border border-green-500/50 p-3 rounded-lg">
              <p className="text-primary text-sm">
                ✓ Webカメラの映像はサーバーに送信されません
              </p>
            </div>
            <div className="bg-green-500/20 border border-green-500/50 p-3 rounded-lg">
              <p className="text-primary text-sm">
                ✓ すべての映像解析はブラウザ内で完結します
              </p>
            </div>
            <div className="bg-green-500/20 border border-green-500/50 p-3 rounded-lg">
              <p className="text-primary text-sm">
                ✓ 学習データのみがサーバーに保存されます
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-center">
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
          >
            {saving ? '保存中...' : '設定を保存'}
          </Button>
        </div>
      </div>
    </div>
  )
}
