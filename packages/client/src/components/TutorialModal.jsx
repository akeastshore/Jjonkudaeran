import React, { useState } from 'react';
import Modal from './ui/Modal';

const TutorialModal = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);

  const pages = [
    {
      title: '0) 조작법',
      content: (
        <ul>
          <li><b>이동</b>: 방향키(← ↑ ↓ →)</li>
          <li><b>집기/놓기</b>: 스페이스바(␣)</li>
          <li className="muted">재료 앞에서 ␣ → 집기 / 작업대·팬·믹서기 앞에서 ␣ → 넣기/놓기</li>
        </ul>
      )
    },
    {
      title: '1) 피스타치오 스프레드 만들기',
      images: {
        left: [
          { src: '/assets/ingredients/pistachio_v1.png', size: 'small' },
          { src: '/assets/ingredients/pistachio_v2.png', size: 'xlarge' }
        ],
        right: [
          { src: '/assets/tools/blender_pistachio_spread.png', size: 'xlarge' },
          { src: '/assets/ingredients/pistachio_spread.png', size: 'large' }
        ]
      },
      content: (
        <ol>
          <li>피스타치오 껍질을 깐다</li>
          <li>믹서기에 넣고 간다 → <b>피스타치오 스프레드 완성</b></li>
        </ol>
      )
    },
    {
      title: '2) 속 만들기',
      images: {
        left: [
          { src: '/assets/ingredients/kadaif_toasted.png', size: 'medium' },
          { src: '/assets/ingredients/white_chocolate.png', size: 'small' },
          { src: '/assets/tools/freezer.png', size: 'medium' }
        ],
        right: [
          { src: '/assets/ingredients/whitechocolate_pistachiospread.png', size: 'medium' },
          { src: '/assets/ingredients/innerpart.png', size: 'medium' }
        ]
      },
      content: (
        <ol>
          <li>화이트 초콜릿을 전자레인지에 녹인다</li>
          <li>피스타치오 스프레드 + 카다이프를 넣는다</li>
          <li>냉동고에 넣어 얼린다 → <b>속 완성</b></li>
        </ol>
      )
    },
    {
      title: '3) 피(겉) 만들기',
      images: {
        left: [
          { src: '/assets/ingredients/marshmallow.png', size: 'small' },
          { src: '/assets/ingredients/cocoa_powder.png', size: 'small' }
        ],
        right: [
          { src: '/assets/tools/burner_final.png', size: 'large' },
          { src: '/assets/ingredients/dough_spreaded.png', size: 'large' }
        ]
      },
      content: (
        <ol>
          <li>팬에 버터를 녹인다</li>
          <li>마시멜로우를 추가해서 완전히 녹인다</li>
          <li>불을 끄고 탈지분유 + 코코아파우더를 넣는다</li>
          <li>판에 펼친다 → <b>피 완성</b></li>
        </ol>
      )
    },
    {
      title: '4) 합체(완성)',
      images: {
        right: { src: '/assets/ingredients/dujjonku_final.png', size: 'large' }
      },
      content: (
        <ol>
          <li>냉동고에서 속을 꺼낸다</li>
          <li>속을 한 개씩 집어서 피로 감싼다</li>
          <li>마지막으로 코코아파우더를 묻힌다 → <b>완성!</b></li>
        </ol>
      )
    }
  ];

  const goToNextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleClose = () => {
    setCurrentPage(0); // 모달 닫을 때 첫 페이지로 리셋
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="튜토리얼: 두쫀쿠 만들기"
      className="tutorial-modal"
    >
      <div className="tutorial-slider">
        {/* 현재 페이지 내용 */}
        <div className="tutorial-page">
          {pages[currentPage].images ? (
            <div className="page-with-images">
              {pages[currentPage].images.left && (
                <div className="page-image left">
                  {Array.isArray(pages[currentPage].images.left) ? (
                    pages[currentPage].images.left.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.src}
                        alt="재료"
                        className={img.size}
                      />
                    ))
                  ) : (
                    <img
                      src={pages[currentPage].images.left.src || pages[currentPage].images.left}
                      alt="재료"
                      className={pages[currentPage].images.left.size || ''}
                    />
                  )}
                </div>
              )}

              <section className="t-section">
                <h3>{pages[currentPage].title}</h3>
                {pages[currentPage].content}
              </section>

              {pages[currentPage].images.right && (
                <div className="page-image right">
                  {Array.isArray(pages[currentPage].images.right) ? (
                    pages[currentPage].images.right.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.src}
                        alt="완성품"
                        className={img.size}
                      />
                    ))
                  ) : (
                    <img
                      src={pages[currentPage].images.right.src || pages[currentPage].images.right}
                      alt="완성품"
                      className={pages[currentPage].images.right.size || ''}
                    />
                  )}
                </div>
              )}
            </div>
          ) : (
            <section className="t-section">
              <h3>{pages[currentPage].title}</h3>
              {pages[currentPage].content}
            </section>
          )}
        </div>

        {/* 네비게이션 */}
        <div className="tutorial-navigation">
          <button
            className="nav-btn prev"
            onClick={goToPrevPage}
            disabled={currentPage === 0}
            aria-label="이전"
          >
            ◀
          </button>

          <div className="page-indicator">
            {currentPage + 1} / {pages.length}
          </div>

          <button
            className="nav-btn next"
            onClick={goToNextPage}
            disabled={currentPage === pages.length - 1}
            aria-label="다음"
          >
            ▶
          </button>
        </div>

        {/* 페이지 도트 인디케이터 */}
        <div className="page-dots">
          {pages.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentPage ? 'active' : ''}`}
              onClick={() => setCurrentPage(index)}
              aria-label={`${index + 1}페이지로 이동`}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default TutorialModal;
