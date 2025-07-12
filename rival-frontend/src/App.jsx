import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

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

  return (
    <Routes>
      {!user ? (
        <Route path="/*" element={<LoginPage />} />
      ) : (
        <>
          <Route
            path="/"
            element={<Dashboard user={user} onLogout={handleLogout} />}
          />
          <Route
            path="/curriculum"
            element={<CurriculumPage user={user} onBack={() => navigate('/')} />}
          />
          <Route
            path="/reports"
            element={<ReportsPage user={user} onBack={() => navigate('/')} />}
          />
          <Route
            path="/settings"
            element={<SettingsPage user={user} onBack={() => navigate('/')} />}
          />
        </>
      )}
    </Routes>
  );
}

export default App;
