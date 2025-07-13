import { useState } from 'react'
import { api } from '../api';
import { auth } from '../firebase' // Firebase初期化ファイルをインポート
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { API_BASE_URL } from '../config'
import ThemeToggle from './ThemeToggle'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('') // パスワード用のstateを追加
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState(null) // エラーメッセージ用のstateを追加

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null) // エラーをリセット

    try {
      let userCredential;
      if (isLogin) {
        // Firebaseでログイン
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Firebaseで新規登録
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }

      const user = userCredential.user;
      const idToken = await user.getIdToken(); // ★重要: FirebaseからIDトークンを取得

      // バックエンドに初回ログインを通知し、ユーザーDBに登録する
      // 既に存在する場合はバックエンド側で何もしない想定
      await api.createUser(auth, user.uid, user.email);

      // ログイン/登録が成功すると、App.jsxのonAuthStateChangedが検知して自動的にダッシュボードに遷移する

    } catch (firebaseError) {
      // Firebaseからのエラーをキャッチして表示
      console.error("Firebase Auth Error:", firebaseError.code);
      setError(firebaseError.message); // エラーメッセージをstateに保存
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            AI Study Buddy <span className="text-primary">"Rival"</span>
          </h1>
          <p className="text-muted-foreground">
            あなたの学習を見守る、厳しくも頼れるライバル
          </p>
        </div>
        
        <Card className="bg-card border">
          <CardHeader>
            <CardTitle className="text-card-foreground">
              {isLogin ? 'ログイン' : '新規登録'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isLogin 
                ? 'メールアドレスとパスワードでログイン' 
                : 'アカウントを作成してください'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  メールアドレス
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-input border text-foreground"
                  placeholder="your@email.com"
                />
              </div>

              {/* パスワード入力欄を追加 */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  パスワード
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-input border text-foreground"
                  placeholder="6文字以上"
                />
              </div>
              
              {/* エラーメッセージ表示欄 */}
              {error && <p className="text-destructive text-sm">{error}</p>}
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLogin ? 'ログイン' : '登録してログイン'}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError(null) // モード切替時にエラーをリセット
                }}
                className="text-primary hover:text-primary/80 text-sm"
              >
                {isLogin 
                  ? '新規登録はこちら' 
                  : 'ログインはこちら'
                }
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
