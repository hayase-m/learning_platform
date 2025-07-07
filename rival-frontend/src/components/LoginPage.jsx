import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { API_BASE_URL } from '../config'

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [isLogin, setIsLogin] = useState(true)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Simple mock authentication - generate a user ID
    const userId = `user_${Date.now()}`
    
    try {
      // Create user in backend
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          email: email,
        }),
      })
      
      if (response.ok || response.status === 400) {
        // User created or already exists
        onLogin({ userId, email })
      } else {
        console.error('Failed to create user')
      }
    } catch (error) {
      console.error('Error:', error)
      // For demo purposes, still allow login
      onLogin({ userId, email })
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
                ? 'メールアドレスでログインしてください' 
                : '新しいアカウントを作成してください'
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
              
              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isLogin ? 'ログイン' : '登録'}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
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

