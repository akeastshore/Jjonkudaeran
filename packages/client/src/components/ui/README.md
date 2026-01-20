# UI 컴포넌트 문서

재사용 가능한 UI 컴포넌트 라이브러리입니다.

## 사용법

```javascript
import { Button, Card, Counter, ... } from '../ui';
```

## 컴포넌트 목록

### Button
다양한 스타일의 버튼 컴포넌트

**Props:**
- `variant`: 버튼 스타일 ('primary', 'create', 'join', 'ready', 'start-game', 'cancel', 'back', 'char-action')
- `onClick`: 클릭 핸들러 함수
- `disabled`: 비활성화 여부 (기본: false)
- `className`: 추가 CSS 클래스
- `style`: 인라인 스타일 객체
- `children`: 버튼 내용

**예시:**
```javascript
<Button variant="create" onClick={handleCreate}>
  방 만들기
</Button>
```

---

### Card
카드 레이아웃 컴포넌트

**Props:**
- `className`: 추가 CSS 클래스
- `style`: 인라인 스타일 객체
- `children`: 카드 내용

**예시:**
```javascript
<Card>
  <h2>제목</h2>
  <p>내용</p>
</Card>
```

---

### Counter
숫자 증가/감소 컴포넌트

**Props:**
- `value`: 현재 값
- `onIncrement`: 증가 핸들러 함수
- `onDecrement`: 감소 핸들러 함수
- `min`: 최소값 (기본: 0)
- `max`: 최대값 (기본: Infinity)
- `style`: 인라인 스타일 객체

**예시:**
```javascript
<Counter
  value={count}
  min={2}
  max={4}
  onIncrement={() => setCount(prev => prev + 1)}
  onDecrement={() => setCount(prev => prev - 1)}
/>
```

---

### Input
입력 필드 컴포넌트

**Props:**
- `id`: input ID
- `placeholder`: placeholder 텍스트
- `className`: 추가 CSS 클래스
- `style`: 인라인 스타일 객체
- `type`: input type (기본: 'text')
- `value`: input value (controlled component용)
- `onChange`: change 핸들러

**예시:**
```javascript
<Input
  id="roomCode"
  placeholder="CODE"
  type="text"
/>
```

---

### PlayerListItem
플레이어 목록 아이템 컴포넌트

**Props:**
- `playerName`: 플레이어 이름
- `avatarUrl`: 아바타 이미지 URL (없으면 '?' 표시)
- `isHost`: 방장 여부 (기본: false)
- `isReady`: 준비 완료 여부 (기본: false)
- `isSelected`: 선택된 플레이어(나) 여부 (기본: false)
- `className`: 추가 CSS 클래스

**예시:**
```javascript
<PlayerListItem
  playerName="홍길동"
  avatarUrl="/path/to/avatar.png"
  isHost={true}
  isReady={true}
/>
```

---

### RoomCode
방 코드 표시 컴포넌트

**Props:**
- `roomId`: 방 코드
- `label`: 레이블 텍스트 (기본: 'Room')
- `className`: 추가 CSS 클래스

**예시:**
```javascript
<RoomCode roomId="ABC123" label="Room" />
```

---

### Timer
타이머 표시 컴포넌트

**Props:**
- `timeLeft`: 남은 시간 (초)
- `warningThreshold`: 경고 표시 기준 시간 (초, 기본: 5)
- `className`: 추가 CSS 클래스

**예시:**
```javascript
<Timer timeLeft={120} warningThreshold={10} />
```

---

### Panel
패널 레이아웃 컴포넌트

**Props:**
- `title`: 패널 제목 (선택사항)
- `className`: 추가 CSS 클래스
- `style`: 인라인 스타일 객체
- `children`: 패널 내용

**예시:**
```javascript
<Panel title="플레이어 대기실">
  <div>내용</div>
</Panel>
```

---

### CharacterItem
캐릭터 선택 아이템 컴포넌트

**Props:**
- `character`: 캐릭터 정보 객체 { id, name, img }
- `isSelected`: 선택된 캐릭터 여부 (기본: false)
- `isDimmed`: 다른 캐릭터가 선택되어 흐려짐 여부 (기본: false)
- `isReady`: 준비 완료 상태 - 선택 불가 (기본: false)
- `onClick`: 클릭 핸들러 함수
- `className`: 추가 CSS 클래스

**예시:**
```javascript
<CharacterItem
  character={{ id: 1, name: '멜로', img: '/path/to/char.png' }}
  isSelected={selectedId === 1}
  onClick={(charId) => setSelectedId(charId)}
/>
```

---

### Modal
범용 모달 컴포넌트

**Props:**
- `isOpen`: 모달 열림 상태 (boolean)
- `onClose`: 닫기 핸들러 함수
- `title`: 모달 제목
- `children`: 모달 내용 (React 노드)
- `footer`: 모달 하단 내용 (React 노드, 선택사항)
- `className`: 추가 CSS 클래스

**기능:**
- ESC 키로 모달 닫기
- 배경 클릭으로 모달 닫기
- 모달 열림 시 페이지 스크롤 방지
- 애니메이션 효과

**예시:**
```javascript
const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="모달 제목"
  footer={<button onClick={() => setIsOpen(false)}>닫기</button>}
>
  <p>모달 내용</p>
</Modal>
```

## 스타일링

모든 UI 컴포넌트는 `App.css`에 정의된 클래스를 사용합니다. 기존 스타일을 유지하면서 재사용성을 높였습니다.

## 컴포넌트 구조

```
components/
  ui/
    Button.jsx          - 버튼 컴포넌트
    Card.jsx            - 카드 컴포넌트
    Counter.jsx         - 카운터 컴포넌트
    Input.jsx           - 입력 필드 컴포넌트
    PlayerListItem.jsx  - 플레이어 목록 아이템
    RoomCode.jsx        - 방 코드 표시
    Timer.jsx           - 타이머 표시
    Panel.jsx           - 패널 레이아웃
    CharacterItem.jsx   - 캐릭터 선택 아이템
    Modal.jsx           - 모달 컴포넌트
    index.js            - 통합 export
    README.md           - 이 문서
  TutorialModal.jsx     - 튜토리얼 모달
```
