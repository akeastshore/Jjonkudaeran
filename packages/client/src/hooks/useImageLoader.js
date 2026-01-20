import { useEffect, useRef } from 'react';
import { INGREDIENT_IMAGES, TOOL_IMAGES } from '../constants/gameConstants';

export const useImageLoader = (selectedChar) => {
  const imagesRef = useRef({});

  useEffect(() => {
    // 재료 이미지 로드
    Object.entries(INGREDIENT_IMAGES).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        // 이미지 로드 완료
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
        // 이미지 로드 완료
      };
      img.onerror = () => {
        console.warn(`도구 이미지 로드 실패: ${src}`);
      };
      imagesRef.current[`tool_${key}`] = img;
    });

    // 캐릭터 이미지 로드
    if (selectedChar) {
      const directions = ['front', 'back', 'left', 'right'];
      directions.forEach(dir => {
        const imgKey = `img${dir.charAt(0).toUpperCase() + dir.slice(1)}`;
        if (selectedChar[imgKey]) {
          const charImg = new Image();
          charImg.src = selectedChar[imgKey];
          charImg.onload = () => {
            // 이미지 로드 완료
          };
          charImg.onerror = () => {
            console.warn(`캐릭터 이미지 로드 실패: ${selectedChar[imgKey]}`);
          };
          imagesRef.current[`playerChar_${dir}`] = charImg;
        }
      });
    }
  }, [selectedChar]);

  return imagesRef;
};
