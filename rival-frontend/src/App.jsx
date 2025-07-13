import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { auth } from './firebase'; // Firebase authをインポート
import { onAuthStateChanged } from 'firebase/auth';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import ReportsPage from './components/ReportsPage';
import SettingsPage from './components/SettingsPage';
import CurriculumPage from './components/CurriculumPage';
import RankingPage from './components/RankingPage';
import Header from './components/Header';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // 認証状態の確認中フラグ
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
    navigate('/'); // ログアウト後はログインページ
  };

  // 認証状態を確認中はローディング表示などを出す（任意）
  if (isLoading) {
    return <div>Loading...</div>; // ここは適切なローディング画面にできる
  }

  const handleNavigation = (path) => {
    navigate(path);
    setIsDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {user && (
        <Header 
          user={user}
          isDrawerOpen={isDrawerOpen}
          setIsDrawerOpen={setIsDrawerOpen}
          location={location}
          handleNavigation={handleNavigation}
          handleLogout={handleLogout}
        />
      )}
      
      <div className={user ? "pt-16" : ""}>
        <Routes>
          {!user ? (
            <Route path="/*" element={<LoginPage />} />
          ) : (
            <>
              <Route
                path="/"
                element={<Dashboard user={user} />}
              />
              <Route
                path="/curriculum"
                element={<CurriculumPage user={user} />}
              />
              <Route
                path="/reports"
                element={<ReportsPage user={user} />}
              />
              <Route
                path="/settings"
                element={<SettingsPage user={user} />}
              />
              <Route
                path="/ranking"
                element={<RankingPage user={user} onBack={() => navigate('/')} />}
              />
            </>
          )}
        </Routes>
      </div>
    </div>
  );
}

export default App;
