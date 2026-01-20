// 재료 색상 매핑
export function getColorForIngredient(name) {
  const map = {
    pistachio: '#93C572',
    kadaif: '#DAA520',
    kadaif_v1: '#D4AF37',
    toastedKadaif: '#CD853F',
    whiteChoco: '#FAF0E6',
    butter: '#F0E68C',
    butter_v2: '#FFE87C',
    marshmallow: '#FFFAFA',
    milkPowder: '#FFF8DC',
    milkPowder_v2: '#FFFACD',
    cocoa: '#8B4513',
    cocoa_v2: '#A0522D',
    peeledPistachio: '#90EE90',
    pistachioSpread: '#228B22',
    meltedWhiteChoco: '#FFFFF0',
    filling: '#ADFF2F',
    hardFilling: '#32CD32',
    meltedMarshmallow: '#EEE',
    dough: '#D2691E',
    panWithDough: '#C0C0C0',
    dujjonku: '#CD853F',
    finalCookie: '#A0522D',
    packagedCookie: '#FF1493',
    whiteChoco_pistachio: '#9ACD32',
    innerpart: '#ADFF2F',
    innerpart: '#ADFF2F',
    frozenInnerpart: '#32CD32',
    innerpart_spreaded: '#98FB98',
  };
  return map[name] || '#FFF';
}

// 재료 이름 매핑
export function getNameForIngredient(id) {
  const map = {
    pistachio: '피스타치오',
    kadaif: '카다이프',
    kadaif_v1: '집은 카다이프',
    toastedKadaif: '볶은 카다이프',
    whiteChoco: '화이트초콜릿',
    butter: '버터',
    butter_v2: '집은 버터',
    marshmallow: '마시멜로',
    milkPowder: '탈지분유',
    milkPowder_v2: '집은 탈지분유',
    cocoa: '코코아파우더',
    cocoa_v2: '집은 코코아파우더',
    peeledPistachio: '깐 피스타치오',
    pistachioSpread: '피스타치오 스프레드',
    meltedWhiteChoco: '녹은 화이트초콜릿',
    filling: '속',
    hardFilling: '굳은 속',
    meltedMarshmallow: '녹은 마시멜로',
    dough: '피',
    panWithDough: '피든 후라이팬',
    dujjonku: '두쫀쿠 (코팅 전)',
    finalCookie: '두쫀쿠',
    packagedCookie: '포장된 두쫀쿠',
    whiteChoco_pistachio: '초코+피스타치오',
    innerpart: '속(innerpart)',
    frozenInnerpart: '얼린 속(frozen_innerpart)',
    innerpart_spreaded: '펴진 속(innerpart_spreaded)',
  };
  return map[id] || id;
}
