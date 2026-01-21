import { useEffect, useRef } from 'react';
import { INGREDIENT_IMAGES, TOOL_IMAGES } from '../constants/gameConstants';
import { CHARACTERS } from '../constants/characters';

export const useImageLoader = (selectedChar) => {
  const imagesRef = useRef({});

  useEffect(() => {
    // 재료 이미지 로드
    Object.entries(INGREDIENT_IMAGES).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        imagesRef.current[key] = img;
      };
      img.onerror = () => {
        console.warn(`이미지 로드 실패: ${src}`);
      };
      imagesRef.current[key] = img;
    });

    // 도구 이미지 로드
    Object.entries(TOOL_IMAGES).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        imagesRef.current[`tool_${key}`] = img;
      };
      img.onerror = () => {
        console.warn(`도구 이미지 로드 실패: ${src}`);
      };
      imagesRef.current[`tool_${key}`] = img;
    });

    // 배경 이미지 로드
    const bgImg = new Image();
    bgImg.src = '/assets/backgrounds/choice_bg.png';
    bgImg.onload = () => {
      imagesRef.current['gameBackground'] = bgImg;
    };
    imagesRef.current['gameBackground'] = bgImg;

    // 캐릭터 이미지 로드 (모든 캐릭터 미리 로드)
    // 멀티플레이어에서 상대방 캐릭터를 그리기 위함
    CHARACTERS.forEach(char => {
      const id = char.id;
      const directions = ['front', 'back', 'left', 'right'];

      directions.forEach(dir => {
        const imgKey = `img${dir.charAt(0).toUpperCase() + dir.slice(1)}`;
        if (char[imgKey]) {
          const charImg = new Image();
          charImg.src = char[imgKey];
          charImg.onload = () => {
            // imagesRef.current[`char_${id}_${dir}`] = charImg;
          };
          // 즉시 할당
          imagesRef.current[`char_${id}_${dir}`] = charImg;
        }
      });
    });

    // (내 캐릭터용 legacy 키도 유지하거나 View에서 charId로 통일 가능)
    // 여기서는 기존 로직 유지 (내 캐릭터 selectedChar)
    if (selectedChar) {
      console.log('캐릭터 이미지 로드 시작:', selectedChar);
      const directions = ['front', 'back', 'left', 'right'];
      directions.forEach(dir => {
        const imgKey = `img${dir.charAt(0).toUpperCase() + dir.slice(1)}`;
        if (selectedChar[imgKey]) {
          const charImg = new Image();
          charImg.src = selectedChar[imgKey];
          imagesRef.current[`playerChar_${dir}`] = charImg;
        }
      });
    }
  }, [selectedChar]);

  return imagesRef;
};
