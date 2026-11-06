// ROMUS Mobile Touch Engine - Pinch-to-zoom, touch pan, double-tap, long-press and keyboard viewport adaptation

export function installMobileTouch(app) {
  let touchStartDist = 0;
  let touchStartZoom = 1;
  let touchStartMidX = 0;
  let touchStartMidY = 0;
  let isPinching = false;
  let lastTapTime = 0;
  let lastTapTarget = null;
  let longPressTimer = null;

  // Prevent default browser gesture zoom and pull-to-refresh on canvas
  document.addEventListener('touchstart', onTouchStart, { passive: false });
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('touchend', onTouchEnd, { passive: false });
  document.addEventListener('touchcancel', onTouchEnd, { passive: false });

  function getActiveBoardView() {
    const leaf = app?.workspace?.activeLeaf;
    if (leaf?.view?.board && leaf?.view?.viewport) return leaf.view;
    return null;
  }

  function onTouchStart(e) {
    const boardView = getActiveBoardView();

    // 1. Double tap detection
    if (e.touches.length === 1) {
      const now = performance.now();
      const target = e.target;
      const cardText = target.closest('.ia-note-content, .ia-mind-text, .ia-flash-question, .ia-flash-answer');

      if (cardText && lastTapTarget === cardText && now - lastTapTime < 380) {
        // Synthesize double click
        const dblEvent = new MouseEvent('dblclick', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: e.touches[0].clientX,
          clientY: e.touches[0].clientY
        });
        cardText.dispatchEvent(dblEvent);
        lastTapTime = 0;
        lastTapTarget = null;
        return;
      }
      lastTapTime = now;
      lastTapTarget = cardText;

      // 2. Long-press detection
      clearTimeout(longPressTimer);
      const isInput = target.closest('input, textarea, [contenteditable="true"]');
      if (!isInput) {
        const touch = e.touches[0];
        longPressTimer = setTimeout(() => {
          if (navigator.vibrate) navigator.vibrate(35);
          const ctxEvent = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            clientX: touch.clientX,
            clientY: touch.clientY,
            button: 2
          });
          target.dispatchEvent(ctxEvent);
        }, 500);
      }
    } else {
      clearTimeout(longPressTimer);
    }

    // 3. Multi-touch Pinch-to-Zoom on Whiteboard
    if (e.touches.length === 2 && boardView && boardView.viewport.contains(e.target)) {
      isPinching = true;
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      touchStartDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchStartZoom = boardView.board.camera.z || 1;
      touchStartMidX = (t1.clientX + t2.clientX) / 2;
      touchStartMidY = (t1.clientY + t2.clientY) / 2;
    }
  }

  function onTouchMove(e) {
    clearTimeout(longPressTimer);
    const boardView = getActiveBoardView();

    if (isPinching && e.touches.length === 2 && boardView) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (touchStartDist > 0 && currentDist > 0) {
        const ratio = currentDist / touchStartDist;
        const rect = boardView.viewport.getBoundingClientRect();
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;

        // Apply smooth zoom
        boardView.zoom(ratio, midX - rect.left, midY - rect.top, false);

        // Also translate camera if fingers move together
        const deltaX = (midX - touchStartMidX) / boardView.board.camera.z;
        const deltaY = (midY - touchStartMidY) / boardView.board.camera.z;
        boardView.board.camera.x += deltaX;
        boardView.board.camera.y += deltaY;
        boardView.camera();

        touchStartDist = currentDist;
        touchStartMidX = midX;
        touchStartMidY = midY;
      }
    }
  }

  function onTouchEnd(e) {
    clearTimeout(longPressTimer);
    if (e.touches.length < 2) {
      isPinching = false;
    }
  }

  // 4. Virtual Keyboard Viewport Adaptation
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      const vh = window.visualViewport.height;
      document.documentElement.style.setProperty('--mobile-visual-height', `${vh}px`);

      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
        setTimeout(() => {
          activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }, 150);
      }
    });
  }
}
