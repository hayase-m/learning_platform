-- ユーザー
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,     -- student/coach/admin
  created_at TIMESTAMP DEFAULT now()
);

-- 目標（Goal）
CREATE TABLE goals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT now()
);

-- レッスン（Lesson）
CREATE TABLE lessons (
  id UUID PRIMARY KEY,
  curriculum_id UUID REFERENCES curriculum(id),
  day INT,                        -- 学習プラン内の日付（1〜30）
  title VARCHAR(100),
  content TEXT,
  resource_url VARCHAR(255)
);

-- 進捗（Progress）
CREATE TABLE progress (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  lesson_id UUID REFERENCES lessons(id),
  status VARCHAR(20),             -- pending/completed
  completed_at TIMESTAMP
);

-- チーム（Team）
CREATE TABLE teams (
  id UUID PRIMARY KEY,
  goal_id UUID REFERENCES goals(id),
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT now()
);

-- チャットメッセージ（CommunityChat）
CREATE TABLE community_chat (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES users(id),
  message TEXT,
  sent_at TIMESTAMP DEFAULT now()
);

