import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot, MessageSquare } from 'lucide-react'

export default function AIFeedback({ focusScore, messages, onNewMessage }) {
  const [lastFeedbackTime, setLastFeedbackTime] = useState(0)

  useEffect(() => {
    const now = Date.now()
    
    // Generate feedback every 30 seconds or when focus score changes significantly
    if (now - lastFeedbackTime > 30000) {
      generateFeedback()
      setLastFeedbackTime(now)
    }
  }, [focusScore])

  const generateFeedback = async () => {
    try {
      const response = await fetch('https://g8h3ilc79pek.manus.space/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          focus_score: focusScore,
          ai_personality: '厳しい'
        }),
      })
      
      const data = await response.json()
      
      if (data.message) {
        const newMessage = {
          id: Date.now(),
          text: data.message,
          timestamp: new Date(),
          type: getMessageType(focusScore)
        }
        
        onNewMessage(newMessage)
      }
    } catch (error) {
      console.error('Error generating feedback:', error)
      
      // Fallback to local feedback
      const fallbackMessage = getFallbackMessage(focusScore)
      const newMessage = {
        id: Date.now(),
        text: fallbackMessage,
        timestamp: new Date(),
        type: getMessageType(focusScore)
      }
      
      onNewMessage(newMessage)
    }
  }

  const getFallbackMessage = (score) => {
    if (score < 30) {
      return "集中力が散漫だ！もっと真剣に取り組め！"
    } else if (score < 60) {
      return "まだまだ甘い。もっと集中できるはずだ。"
    } else if (score < 80) {
      return "悪くないが、まだ上を目指せる。"
    } else {
      return "素晴らしい集中力だ！この調子を維持しろ！"
    }
  }

  const getMessageType = (score) => {
    if (score < 30) return 'critical'
    if (score < 60) return 'warning'
    if (score < 80) return 'info'
    return 'success'
  }

  const getMessageStyle = (type) => {
    switch (type) {
      case 'critical':
        return 'bg-red-500/20 border-red-500/50 text-destructive'
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
      case 'info':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-300'
      case 'success':
        return 'bg-green-500/20 border-green-500/50 text-primary'
      default:
        return 'bg-card border text-card-foreground'
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className="bg-card border dark:border-white h-full">
      <CardHeader>
        <CardTitle className="text-card-foreground flex items-center gap-2">
          <Bot className="w-5 h-5" />
          AIライバルからのメッセージ
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="w-8 h-8 mx-auto mb-2" />
              <p>学習を開始すると、AIライバルからのメッセージが表示されます</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg border ${getMessageStyle(message.type)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <Badge 
                    variant="outline" 
                    className="text-xs border-current"
                  >
                    AI Rival
                  </Badge>
                  <span className="text-xs opacity-70">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">
                  {message.text}
                </p>
              </div>
            ))
          )}
        </div>
        
        {messages.length > 0 && (
          <div className="mt-4 pt-4 border-t border dark:border-white">
            <div className="text-xs text-muted-foreground text-center">
              最新のメッセージが上部に表示されます
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

