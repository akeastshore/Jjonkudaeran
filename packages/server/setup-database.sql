-- 두바이쫀득쿠키 게임 데이터베이스 설정

-- 1. 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS jjonkudaeran CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 데이터베이스 선택
USE jjonkudaeran;

-- 2. users 테이블 생성 (사용자 정보)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  picture TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_google_id (google_id),
  INDEX idx_email (email)
);

-- 3. game_scores 테이블 생성 (게임 점수)
CREATE TABLE IF NOT EXISTS game_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  game_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_score (score DESC)
);

-- 4. user_stats 테이블 생성 (사용자 통계)
CREATE TABLE IF NOT EXISTS user_stats (
  user_id INT PRIMARY KEY,
  total_games INT DEFAULT 0,
  total_score INT DEFAULT 0,
  highest_score INT DEFAULT 0,
  average_score DECIMAL(10,2) DEFAULT 0.00,
  last_played_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 완료 메시지
SELECT '✅ 데이터베이스 설정 완료!' as message;
