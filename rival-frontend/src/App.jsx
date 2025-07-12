import { useState, useEffect } from 'react';
import { auth } from './firebase'; // Firebase authをインポート
import { onAuthStateChanged } from 'firebase/auth';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import ReportsPage from './components/ReportsPage';
import SettingsPage from './components/SettingsPage';
import CurriculumPage from './components/CurriculumPage';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // 認証状態の確認中フラグ
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    // Firebaseの認証状態の変更を監視
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser); // ユーザー情報を更新
      setIsLoading(false); // 確認完了
    });

    // コンポーネントのアンマウント時に監視を解除
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  // 認証状態を確認中はローディング表示などを出す（任意）
  if (isLoading) {
    return <div>Loading...</div>; // ここは適切なローディング画面にできる
  }

  if (!user) {
    return <LoginPage />;
  }

  // ... (switch文は変更なし)

  switch (currentPage) {
    case 'curriculum':
      return (
        <CurriculumPage 
          user={user} 
          onBack={() => handleNavigate('dashboard')} 
        />
      )
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
