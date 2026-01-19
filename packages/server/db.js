// MySQL 데이터베이스 연결
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// 연결 풀 생성 (여러 연결을 효율적으로 관리)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jjonkudaeran',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// DB 연결 테스트
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL 연결 성공!');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL 연결 실패:', error.message);
    return false;
  }
}

// 사용자 관련 함수들
export const userDB = {
  // 구글 ID로 사용자 찾기
  async findByGoogleId(googleId) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE google_id = ?',
      [googleId]
    );
    return rows[0];
  },

  // 사용자 ID로 찾기
  async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  // 새 사용자 생성
  async create(googleId, email, name, picture) {
    const [result] = await pool.query(
      'INSERT INTO users (google_id, email, name, picture) VALUES (?, ?, ?, ?)',
      [googleId, email, name, picture]
    );
    
    // 생성된 사용자 반환
    return this.findById(result.insertId);
  },

  // 모든 사용자 조회
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return rows;
  },

  // 사용자 수
  async count() {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM users');
    return rows[0].count;
  }
};

// 게임 점수 관련 함수들
export const scoreDB = {
  // 점수 저장
  async create(userId, score) {
    const [result] = await pool.query(
      'INSERT INTO game_scores (user_id, score) VALUES (?, ?)',
      [userId, score]
    );
    return result.insertId;
  },

  // 사용자의 모든 점수 조회
  async findByUserId(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM game_scores WHERE user_id = ? ORDER BY game_date DESC',
      [userId]
    );
    return rows;
  },

  // 최고 점수 랭킹 (상위 10명)
  async getTopScores(limit = 10) {
    const [rows] = await pool.query(`
      SELECT 
        u.name,
        u.picture,
        gs.score,
        gs.game_date
      FROM game_scores gs
      JOIN users u ON gs.user_id = u.id
      ORDER BY gs.score DESC
      LIMIT ?
    `, [limit]);
    return rows;
  }
};

// 사용자 통계 관련 함수들
export const statsDB = {
  // 통계 업데이트
  async update(userId) {
    // 통계 계산
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_games,
        SUM(score) as total_score,
        MAX(score) as highest_score,
        AVG(score) as average_score,
        MAX(game_date) as last_played_at
      FROM game_scores
      WHERE user_id = ?
    `, [userId]);

    const s = stats[0];

    // 통계 저장/업데이트
    await pool.query(`
      INSERT INTO user_stats 
        (user_id, total_games, total_score, highest_score, average_score, last_played_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        total_games = VALUES(total_games),
        total_score = VALUES(total_score),
        highest_score = VALUES(highest_score),
        average_score = VALUES(average_score),
        last_played_at = VALUES(last_played_at)
    `, [userId, s.total_games, s.total_score || 0, s.highest_score || 0, s.average_score || 0, s.last_played_at]);
  },

  // 사용자 통계 조회
  async getByUserId(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM user_stats WHERE user_id = ?',
      [userId]
    );
    return rows[0];
  }
};

// DB 연결 테스트 실행
testConnection();

export default pool;
