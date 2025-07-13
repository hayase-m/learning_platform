import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
import { Button } from './ui/button'
import { Menu, Home, BookOpen, BarChart3, Settings, LogOut, Trophy } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

export default function Header({ user, isDrawerOpen, setIsDrawerOpen, location, handleNavigation, handleLogout }) {
  const navigationItems = [
    { path: '/', label: 'ダッシュボード', icon: Home },
    { path: '/curriculum', label: 'カリキュラム', icon: BookOpen },
    { path: '/ranking', label: 'ランキング', icon: Trophy },
    { path: '/reports', label: 'レポート', icon: BarChart3 },
    { path: '/settings', label: '設定', icon: Settings },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b h-16 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-card border"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-card border-r">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-foreground">AI Study Buddy</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <nav className="flex-1 p-4">
                <div className="space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.path
                    return (
                      <Button
                        key={item.path}
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full justify-start ${isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'}`}
                        onClick={() => handleNavigation(item.path)}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {item.label}
                      </Button>
                    )
                  })}
                </div>
              </nav>
              <div className="p-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-400 hover:bg-red-400/10"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  ログアウト
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        <h1 className="text-xl font-bold text-foreground">
          AI Study Buddy <span className="text-primary">"Rival"</span>
        </h1>
      </div>
      
      <ThemeToggle />
    </header>
  )
}