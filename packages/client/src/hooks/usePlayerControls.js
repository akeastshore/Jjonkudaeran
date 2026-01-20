import { useEffect } from 'react';

export const usePlayerControls = (keysRef) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Space"].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current[e.key] = true; 
    };
    
    const handleKeyUp = (e) => { 
      keysRef.current[e.key] = false; 
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keysRef]);
};
