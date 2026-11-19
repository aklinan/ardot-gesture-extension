/* Ardot 手势增强  v1.2.1
 * 滚轮 = 以指针为中心缩放；右键拖拽 = 平移画布（改写成中键拖拽）。
 * 开关：Ctrl+Alt+J（状态持久化）
 */
(() => {
  'use strict';
  if (window.__ardotGestureLoaded) return;
  window.__ardotGestureLoaded = true;

  const CFG = {
    zoomKey: 'ctrl',    // 'ctrl' | 'alt'
    onlyCanvas: true,
    toggleKey: 'j',
    invertWheel: false,
  };

  const K_ON = 'ardot_gesture_enabled';

  let enabled = localStorage.getItem(K_ON) !== '0';

  const onCanvas = (t) =>
    !CFG.onlyCanvas || !!(t && (t.tagName === 'CANVAS' || (t.closest && t.closest('canvas'))));

  /* ---------- 轻提示 ---------- */
  let tipTimer = 0;
  function toast(msg) {
    let el = document.getElementById('__ardot_gesture_tip');
    if (!el) {
      el = document.createElement('div');
      el.id = '__ardot_gesture_tip';
      el.style.cssText = [
        'position:fixed', 'left:50%', 'bottom:48px', 'transform:translateX(-50%)',
        'z-index:2147483647', 'padding:8px 16px', 'border-radius:8px',
        'background:rgba(30,26,20,.92)', 'color:#FBEFD2',
        'font:13px/1.4 "PingFang SC","Microsoft YaHei",system-ui,sans-serif',
        'pointer-events:none', 'transition:opacity .25s', 'white-space:nowrap',
        'box-shadow:0 6px 20px rgba(0,0,0,.25)',
      ].join(';');
      (document.body || document.documentElement).appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => { el.style.opacity = '0'; }, 1600);
  }

  /* ---------- 开关 ---------- */
  window.addEventListener('keydown', (e) => {
    if (!e.ctrlKey || !e.altKey) return;
    if ((e.key || '').toLowerCase() === CFG.toggleKey) {
      enabled = !enabled;
      localStorage.setItem(K_ON, enabled ? '1' : '0');
      toast(enabled ? '手势增强：已开启' : '手势增强：已关闭');
      e.preventDefault(); e.stopImmediatePropagation();
    }
  }, true);

  /* ---------- 1. 滚轮 => 缩放 ---------- */
  window.addEventListener('wheel', (e) => {
    if (!enabled || !onCanvas(e.target)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.shiftKey) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    const dir = CFG.invertWheel ? -1 : 1;
    e.target.dispatchEvent(new WheelEvent('wheel', {
      bubbles: true, cancelable: true, composed: true, view: window,
      deltaX: e.deltaX * dir, deltaY: e.deltaY * dir, deltaZ: e.deltaZ,
      deltaMode: e.deltaMode,
      clientX: e.clientX, clientY: e.clientY,
      screenX: e.screenX, screenY: e.screenY,
      ctrlKey: CFG.zoomKey === 'ctrl',
      altKey: CFG.zoomKey === 'alt',
    }));
  }, { capture: true, passive: false });

  /* ---------- 2. 右键拖拽 => 中键平移 ---------- */
  let panning = false;
  let panTarget = null;
  let captured = false;

  function forward(type, src, button, buttons, ptrButton) {
    try {
      panTarget.dispatchEvent(new PointerEvent(type, {
        bubbles: true, cancelable: true, composed: true, view: window,
        pointerId: src.pointerId, pointerType: src.pointerType || 'mouse',
        isPrimary: true, width: 1, height: 1,
        clientX: src.clientX, clientY: src.clientY,
        screenX: src.screenX, screenY: src.screenY,
        button: ptrButton, buttons,
        ctrlKey: src.ctrlKey, shiftKey: src.shiftKey,
        altKey: src.altKey, metaKey: src.metaKey,
        pressure: buttons ? 0.5 : 0,
      }));
    } catch (_) { /* noop */ }

    try {
      panTarget.dispatchEvent(new MouseEvent(
        type === 'pointerdown' ? 'mousedown' : type === 'pointermove' ? 'mousemove' : 'mouseup', {
          bubbles: true, cancelable: true, composed: true, view: window,
          clientX: src.clientX, clientY: src.clientY,
          screenX: src.screenX, screenY: src.screenY,
          button, buttons,
          ctrlKey: src.ctrlKey, shiftKey: src.shiftKey,
          altKey: src.altKey, metaKey: src.metaKey,
        }
      ));
    } catch (_) { /* noop */ }
  }

  // 右键菜单始终屏蔽（否则拖到一半会弹菜单）
  window.addEventListener('contextmenu', (e) => {
    if (!enabled || !onCanvas(e.target)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);

  window.addEventListener('pointerdown', (e) => {
    if (!enabled || e.button !== 2 || !onCanvas(e.target)) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    panning = true;
    panTarget = e.target;

    // 先替 App 抢一次指针捕获，避免它内部 setPointerCapture 抛错
    try { panTarget.setPointerCapture(e.pointerId); captured = true; } catch (_) { captured = false; }

    forward('pointerdown', e, 1, 4, 1);
  }, true);

  window.addEventListener('pointermove', (e) => {
    if (!enabled || !panning || !panTarget) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    forward('pointermove', e, -1, 4, -1);
  }, { capture: true, passive: false });

  const endPan = (e) => {
    if (!panning || !panTarget) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    panning = false;

    forward('pointerup', e, 1, 0, 1);

    if (captured) {
      try { panTarget.releasePointerCapture(e.pointerId); } catch (_) {}
      captured = false;
    }
    panTarget = null;
  };

  window.addEventListener('pointerup', endPan, true);
  window.addEventListener('pointercancel', endPan, true);
  window.addEventListener('blur', () => {
    if (!panning) return;
    panning = false;
    panTarget = null;
  });
})();
