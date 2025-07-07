import { useState } from 'react'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import ReportsPage from './components/ReportsPage'
import SettingsPage from './components/SettingsPage'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('dashboard')

  const handleLogin = (userData) => {
    setUser(userData)
    setCurrentPage('dashboard')
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentPage('dashboard')
  }

  const handleNavigate = (page) => {
    setCurrentPage(page)
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  switch (currentPage) {
    case 'reports':
      return (
        <ReportsPage 
          user={user} 
          onBack={() => handleNavigate('dashboard')} 
        />
      )
    case 'settings':
      return (
        <SettingsPage 
          user={user} 
          onBack={() => handleNavigate('dashboard')} 
        />
      )
    default:
      return (
        <Dashboard 
          user={user} 
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
      )
  }
}

export default App
