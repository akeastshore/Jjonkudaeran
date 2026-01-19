// server.js
import express from 'express';
import { createServer } from 'http'; 
import { Server } from 'socket.io'; 
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import { userDB, scoreDB, statsDB } from './db.js';

dotenv.config();

const app = express();

app.set('trust proxy', 1);
const PORT = process.env.PORT || 2567;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,     // 자바스크립트로 쿠키 접근 불가 (보안)
    secure: false,      // http 환경이므로 false (https면 true)
    sameSite: 'lax',    // ★ [추가] 이게 중요합니다. (strict, lax, none 중 lax 추천)
    maxAge: 1000 * 60 * 60 * 24 // 쿠키 유효기간 (예: 1일)
  }
}));

app.use(passport.initialize());
app.use(passport.session());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// --- 소켓 로직 ---
const rooms = {}; 
const players = {};

io.on('connection', (socket) => {
  console.log(`🔌 사용자 접속: ${socket.id}`);

  // 1. 방 만들기
  socket.on('createRoom', ({ maxPlayers, nickname }) => {
    const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    rooms[roomId] = {
      maxPlayers: parseInt(maxPlayers),
      currentPlayers: 1,
      isPlaying: false
    };

    socket.join(roomId);
    
    players[socket.id] = {
      roomId: roomId,
      nickname: nickname, // 닉네임 저장
      x: 400, y: 300,
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      direction: 'down',
      holding: null,
      charId: null,
      isReady: false,
      wantsRestart: false
    };

    socket.emit('roomCreated', roomId);

    io.to(roomId).emit('waitingUpdate', { 
      current: 1, 
      max: rooms[roomId].maxPlayers,
      members: [nickname]
    });
  });

  // 2. 방 참가하기
  socket.on('joinRoom', ({ roomId, nickname }) => {
    const room = rooms[roomId];

    if (!room) return socket.emit('error', '존재하지 않는 방입니다.');
    if (room.currentPlayers >= room.maxPlayers) return socket.emit('error', '방이 꽉 찼습니다.');
    if (room.isPlaying) return socket.emit('error', '이미 게임이 시작된 방입니다.');

    socket.join(roomId);
    room.currentPlayers += 1;

    players[socket.id] = {
      roomId: roomId,
      nickname: nickname,
      charId: null,
      isReady: false,
      wantsRestart: false,
      x: 400, y: 300, color: '#' + Math.floor(Math.random()*16777215).toString(16), direction: 'down', holding: null
    };

    // 닉네임 목록 수집
    const roomSockets = io.sockets.adapter.rooms.get(roomId);
    const memberNames = [];
    if(roomSockets) {
        roomSockets.forEach(id => {
            if(players[id]) memberNames.push(players[id].nickname);
        });
    }

    io.to(roomId).emit('waitingUpdate', { 
      current: room.currentPlayers, 
      max: room.maxPlayers,
      members: memberNames
    });

    if (room.currentPlayers === room.maxPlayers) {
      setTimeout(() => {
        io.to(roomId).emit('allPlayersJoined'); 
      }, 1000);
    }
  });

  socket.on('voteRestart', () => {
    const p = players[socket.id];
    if (p) {
      // 상태 토글 (누르면 켜지고, 다시 누르면 꺼짐)
      p.wantsRestart = !p.wantsRestart;
      
      const roomId = p.roomId;
      
      // 방 사람들에게 상태 업데이트 (화면에 누가 눌렀는지 보여주기 위해)
      broadcastRoomUpdate(roomId);

      // ★ 방 안의 모든 사람이 재시작을 원하면?
      const roomSockets = io.sockets.adapter.rooms.get(roomId);
      if (roomSockets) {
        const ids = Array.from(roomSockets);
        const allAgreed = ids.every(id => players[id] && players[id].wantsRestart);
        
        if (allAgreed) {
           // 1. 모든 사람의 상태 초기화 (다음 판을 위해)
           ids.forEach(id => {
             if (players[id]) {
                players[id].wantsRestart = false;
                players[id].isReady = false; // (선택사항) 로비 준비 상태도 초기화
             }
           });
           
           // 2. 상태 업데이트 한번 더 전송 (초기화된 거 보여줌)
           broadcastRoomUpdate(roomId);

           // 3. 게임 시작 신호 발사!
           io.to(roomId).emit('restartGame');
        }
      }
    }
  });

  // 3. 캐릭터 선택
  socket.on('selectCharacter', (charId) => {
    if (players[socket.id]) {
      players[socket.id].charId = charId;
      broadcastRoomUpdate(players[socket.id].roomId);
    }
  });

  // 4. 준비 토글
  socket.on('toggleReady', () => {
    const p = players[socket.id];
    // 캐릭터가 있어야만 준비 가능
    if (p && p.charId) {
      p.isReady = !p.isReady;
      broadcastRoomUpdate(p.roomId);

      const roomId = p.roomId;
      const roomSockets = io.sockets.adapter.rooms.get(roomId);
      if (roomSockets) {
        const ids = Array.from(roomSockets);
        // 전원 준비 완료 시
        if (ids.every(id => players[id] && players[id].isReady)) {
           rooms[roomId].isPlaying = true;
           io.to(roomId).emit('gameStart');
        }
      }
    }
  });

  // 5. 퇴장
  socket.on('disconnect', () => {
    const p = players[socket.id];
    if (p) {
      const roomId = p.roomId;
      delete players[socket.id];
      
      if (rooms[roomId]) {
        rooms[roomId].currentPlayers -= 1;
        if (rooms[roomId].currentPlayers <= 0) {
          delete rooms[roomId];
        } else {
             io.to(roomId).emit('playerLeft'); 
             delete rooms[roomId]; 
        }
      }
    }
  });

  function broadcastRoomUpdate(roomId) {
    const roomSockets = io.sockets.adapter.rooms.get(roomId);
    const roomPlayers = {};
    if (roomSockets) {
        roomSockets.forEach(id => { if (players[id]) roomPlayers[id] = players[id]; });
    }
    io.to(roomId).emit('roomUpdate', roomPlayers);
  }

  socket.on('syncGame', () => {
    const p = players[socket.id];
    if (p) {
      // 이 요청을 보낸 사람에게만 방의 현재 멤버 목록을 보내줌
      const roomId = p.roomId;
      const roomSockets = io.sockets.adapter.rooms.get(roomId);
      const roomPlayers = {};
      if (roomSockets) {
        roomSockets.forEach(id => { 
          if (players[id]) roomPlayers[id] = players[id]; 
        });
      }
      socket.emit('roomUpdate', roomPlayers); // 나한테만 전송
    }
  });

  socket.on('updateItemState', (itemData) => {
    const p = players[socket.id];
    if (p) {
      // 나를 제외한 방 사람들에게 "이 아이템 상태 바꿔!"라고 전달
      socket.to(p.roomId).emit('updateItemState', itemData);
    }
  });

  socket.on('removeItem', (uid) => {
    const p = players[socket.id];
    if (p) {
      // 나를 뺀 나머지 사람들에게 "이 아이템 지워!" 전송
      socket.to(p.roomId).emit('removeItem', uid);
    }
  });

  // 2. [NEW] 점수 동기화
  socket.on('updateScore', (newScore) => {
    const p = players[socket.id];
    if (p) {
      // 방 정보에 점수 저장 (선택 사항이지만 안전을 위해)
      if (rooms[p.roomId]) rooms[p.roomId].score = newScore;
      
      // 나를 뺀 나머지 사람들에게 "점수 갱신해!" 전송
      socket.to(p.roomId).emit('updateScore', newScore);
    }
  });

  socket.on('playerMovement', (d) => {
    const p = players[socket.id];
    if (p) {
      // 1. 서버 메모리에 최신 위치 저장 (중요!)
      p.x = d.x;
      p.y = d.y;
      p.direction = d.direction;

      // 2. 방 안의 다른 사람들에게 전송
      // 이제 p가 최신 정보를 담고 있으므로 p만 보내도 됨
      socket.to(p.roomId).emit('playerMoved', { 
        id: socket.id, 
        x: d.x, 
        y: d.y, 
        direction: d.direction,
        color: p.color,       // 색상 정보 유지
        nickname: p.nickname  // 닉네임 유지
      });
    }
  });
  // 3. [NEW] 불(Fire) 상태 동기화
  socket.on('updateFireState', (fireData) => {
    const p = players[socket.id];
    if (p) {
      // 나 빼고 방 사람들에게 "불 상태 바꿔!" 전송
      socket.to(p.roomId).emit('updateFireState', fireData);
    }
  });

  // 4. [NEW] 게임 재시작 요청 (Restart)
  socket.on('requestRestart', () => {
    const p = players[socket.id];
    if (p) {
      // 방 전체에 "게임 재시작해!" 신호 발사
      io.to(p.roomId).emit('restartGame');
    }
  });
});

// --- Passport & API ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://172.10.5.111.nip.io/auth/google/callback",
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      const googleId = profile.id;
      let user = await userDB.findByGoogleId(googleId);
      if (!user) {
        user = await userDB.create(googleId, profile.emails[0].value, profile.displayName, profile.photos[0]?.value);
      }
      return done(null, user);
    } catch (error) { return done(error, null); }
  }
));

passport.serializeUser((user, done) => {
  console.log("✅ 로그인 성공! 세션에 저장할 ID:", user.id); // 로그 추가
  done(null, user.id); // 보통 user.id (숫자)만 저장합니다.
});

passport.deserializeUser(async (id, done) => {
  console.log("🔄 유저 정보 복구 시도. ID:", id); // 로그 추가
  try {
    const user = await userDB.findById(id); 

      if (user) {
        console.log("🙆‍♂️ 유저 찾음:", user.name || user.email);
        done(null, user);
      } else {
        console.log("🙅‍♂️ DB에 유저가 없음");
        done(null, false);
      }
    } catch (err) {
      console.error("❌ 유저 복구 중 에러:", err);
      done(err);
    }
});

app.get('/auth/google', (req, res, next) => {
  if (req.query.popup) req.session.isPopup = true;
  next();
}, passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // 배포 환경이므로 IP 주소로 기본값 변경 (중요!)
    const frontendURL = process.env.CLIENT_URL || 'http://172.10.5.111.nip.io'; 

    // ★ [핵심] 세션 저장이 끝난 뒤에 콜백함수가 실행됩니다.
    req.session.save(() => {
        res.send(`
          <script>
            if (window.opener) {
              // 1. 부모 창(게임 화면)에 성공 신호 보냄
              window.opener.postMessage({ type: 'LOGIN_SUCCESS' }, '*');
              // 2. 팝업 닫기
              window.close();
            } else {
              // 팝업이 아닐 경우 메인으로 이동
              window.location.href = '${frontendURL}';
            }
          </script>
        `);
    });
  }
);

app.get('/api/me', (req, res) => res.json(req.isAuthenticated() ? req.user : null));

httpServer.listen(PORT, () => {
  console.log(`\n🚀 게임 서버 실행 중! (Port: ${PORT})`);
});