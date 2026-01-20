// 게임 설정 상수
export const GRID_SIZE = 40;
export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 600;
export const PLAYER_SIZE = 60;
export const ITEM_SIZE = 90;
export const MOVE_DELAY = 70;

// 재료 이미지 경로 매핑
export const INGREDIENT_IMAGES = {
  pistachio: '/assets/ingredients/pistachio_v1.png',
  peeledPistachio: '/assets/ingredients/pistachio_v2.png',
  pistachioSpread: '/assets/ingredients/pistachio_spread.png',
  kadaif: '/assets/ingredients/kadaif.png',
  kadaif_v1: '/assets/ingredients/kadaif_v1.png',
  toastedKadaif: '/assets/ingredients/kadaif_toasted.png',
  whiteChoco: '/assets/ingredients/white_chocolate.png',
  meltedWhiteChoco: '/assets/ingredients/white_chocolate_melted.png',
  whiteChoco_pistachio: '/assets/ingredients/whitechocolate_pistachiospread.png',
  butter: '/assets/ingredients/butter.png',
  butter_v2: '/assets/ingredients/butter_v2.png',
  marshmallow: '/assets/ingredients/marshmallow.png',
  meltedMarshmallow: '/assets/tools/marshmallow_melted.png',
  milkPowder: '/assets/ingredients/milk_powder.png',
  milkPowder_v2: '/assets/ingredients/milk_powder_v2.png',
  cocoa: '/assets/ingredients/cocoa_powder.png',
  cocoa_v2: '/assets/ingredients/cocoa_powder_v2.png',
  filling: '/assets/ingredients/pistachio_spread.png',
  hardFilling: '/assets/ingredients/pistachio_spread.png',
  dough: '/assets/ingredients/dujjonku.png',
  panWithDough: '/assets/tools/burner_final.png',
  finalCookie: '/assets/ingredients/dujjonku_fianl.png',
  packagedCookie: '/assets/ingredients/dujjonku_fianl.png',
};

// 도구 이미지 경로 매핑
export const TOOL_IMAGES = {
  fridge: '/assets/tools/freezer.png',
  microwave: '/assets/tools/microwave.png',
  fire: '/assets/tools/burner.png',
  blend: '/assets/tools/blender_closed.png',
  peel: '/assets/tools/tray.png',
  package: '/assets/tools/wrapper.png',
  mix: '/assets/tools/bowl.png',
};

// 범례 데이터
export const INGREDIENT_LEGEND = [
  { name: '피스타치오', color: '#93C572' },
  { name: '깐 피스타치오', color: '#90EE90' },
  { name: '피스타치오 스프레드', color: '#228B22' },
  { name: '카다이프', color: '#DAA520' },
  { name: '볶은 카다이프', color: '#CD853F' },
  { name: '화이트초콜릿', color: '#FAF0E6' },
  { name: '녹은 화이트초콜릿', color: '#FFFFF0' },
  { name: '초코+피스타치오 믹스', color: '#9ACD32' },
  { name: '버터', color: '#F0E68C' },
  { name: '마시멜로', color: '#FFFAFA' },
  { name: '녹은 마시멜로', color: '#EEE' },
  { name: '탈지분유', color: '#FFF8DC' },
  { name: '코코아파우더', color: '#8B4513' },
  { name: '속', color: '#ADFF2F' },
  { name: '굳은 속', color: '#32CD32' },
  { name: '피', color: '#D2691E' },
  { name: '두쫀쿠(완성)', color: '#A0522D' },
  { name: '포장된 두쫀쿠', color: '#FF1493' },
];

// 맵 레이아웃
export const LAYOUT = [
  // [상단]
  { x: 3, y: 0, w: 2, h: 2, label: '', type: 'station', func: 'peel' },
  { x: 5, y: 0, w: 2, h: 2, label: '', type: 'station', func: 'counter' },
  { x: 7, y: 0, w: 2, h: 2, label: '', type: 'station', func: 'blend' },
  { x: 9, y: 0, w: 2, h: 2, label: '', type: 'exit' },
  { x: 11, y: 0, w: 2, h: 2, label: '', type: 'station', func: 'spread' },
  { x: 13, y: 0, w: 2, h: 2, label: '', type: 'station', func: 'package' },

  // [왼쪽 재료]
  { x: 0, y: 3, w: 2, h: 2, label: '', type: 'station', ingredient: 'pistachio' },
  { x: 0, y: 5, w: 2, h: 2, label: '', type: 'station', ingredient: 'kadaif' },
  { x: 0, y: 7, w: 2, h: 2, label: '', type: 'station', ingredient: 'whiteChoco' },

  // [오른쪽 재료]
  { x: 18, y: 3, w: 2, h: 2, label: '', type: 'station', ingredient: 'butter' },
  { x: 18, y: 5, w: 2, h: 2, label: '', type: 'station', ingredient: 'marshmallow' },
  { x: 18, y: 7, w: 2, h: 2, label: '', type: 'station', ingredient: 'milkPowder' },
  { x: 18, y: 9, w: 2, h: 2, label: '', type: 'station', ingredient: 'cocoa' },

  // [하단 도구]
  { x: 3, y: 13, w: 2, h: 2, label: '', type: 'station', func: 'fridge' },
  { x: 5, y: 13, w: 2, h: 2, label: '', type: 'station', func: 'microwave' },
  { x: 7, y: 13, w: 2, h: 2, label: '', type: 'station', func: 'fire' },
  { x: 9, y: 13, w: 2, h: 2, label: '', type: 'station', func: 'fire' },
  { x: 11, y: 13, w: 2, h: 2, label: '', type: 'station', func: 'fire' },
  { x: 13, y: 13, w: 2, h: 2, label: '', type: 'station', func: 'mix' },
];

// Zones 계산 (LAYOUT에서 생성)
export const createZones = () => {
  return LAYOUT.map(z => ({
    ...z,
    px: z.x * GRID_SIZE,
    py: z.y * GRID_SIZE,
    pw: z.w * GRID_SIZE,
    ph: z.h * GRID_SIZE,
  }));
};

// 초기 재료 상태
export const INITIAL_INGREDIENTS = {};
