import React, { useEffect } from 'react';

/**
 * 범용 모달 컴포넌트
 * @param {boolean} isOpen - 모달 열림 상태
 * @param {function} onClose - 닫기 핸들러
 * @param {string} title - 모달 제목
 * @param {React.ReactNode} children - 모달 내용
 * @param {React.ReactNode} footer - 모달 하단 (선택사항)
 * @param {string} className - 추가 CSS 클래스
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  className = '' 
}) => {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      // 모달 열릴 때 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      // 모달 닫힐 때 스크롤 복원
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 배경 클릭으로 모달 닫기
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="modal-backdrop" 
      onClick={handleBackdropClick}
      aria-hidden={!isOpen}
    >
      <div className={`modal ${className}`.trim()} role="dialog" aria-modal="true">
        {/* 헤더 */}
        <div className="modal-header">
          <h2>{title}</h2>
          <button 
            className="modal-close" 
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 바디 */}
        <div className="modal-body">
          {children}
        </div>

        {/* 푸터 (선택사항) */}
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
