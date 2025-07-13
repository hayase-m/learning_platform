import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '../contexts/ThemeContext'

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="text-foreground border hover:bg-accent"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  )
}