import { useState } from 'react'
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

export default function LoginPage({ onLogin }) {
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
      await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}` // ★ヘッダーにトークンを付与
        },
        body: JSON.stringify({ email: user.email }),
      });

      // 親コンポーネントにユーザー情報とトークンを渡してログイン完了
      onLogin({ user, idToken });

    } catch (firebaseError) {
      // Firebaseからのエラーをキャッチして表示
      console.error("Firebase Auth Error:", firebaseError.code);
      setError(firebaseError.message); // エラーメッセージをstateに保存
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            AI Study Buddy <span className="text-purple-400">"Rival"</span>
          </h1>
          <p className="text-slate-300">
            あなたの学習を見守る、厳しくも頼れるライバル
          </p>
        </div>
        
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">
              {isLogin ? 'ログイン' : '新規登録'}
            </CardTitle>
            <CardDescription className="text-slate-300">
              {isLogin 
                ? 'メールアドレスとパスワードでログイン' 
                : 'アカウントを作成してください'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  メールアドレス
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  placeholder="your@email.com"
                />
              </div>

              {/* パスワード入力欄を追加 */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  パスワード
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="6文字以上"
                />
              </div>
              
              {/* エラーメッセージ表示欄 */}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              
              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
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
                className="text-purple-400 hover:text-purple-300 text-sm"
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
