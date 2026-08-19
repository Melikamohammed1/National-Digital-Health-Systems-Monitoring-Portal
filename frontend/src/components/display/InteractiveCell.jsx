import { useEffect, useRef, useState } from 'react';
import { DEVICE_PRESETS } from '../../utils/devicePresets.js';

const SPECIAL_KEY_MAP = {
  ' ': 'Space', Backspace: 'Backspace', Enter: 'Enter', Tab: 'Tab', Escape: 'Escape',
  ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight',
  Shift: 'Shift', Control: 'Control', Alt: 'Alt', Delete: 'Delete',
  Home: 'Home', End: 'End', PageUp: 'PageUp', PageDown: 'PageDown'
};

/**
 * Streams a live headless-browser tab and forwards mouse/keyboard/touch
 * input to it — this is the AnyDesk-style mechanism: nothing here is ever
 * put in an <iframe>, the target site is rendered server-side and shipped
 * as JPEG frames, so embedding restrictions never apply. Works on any
 * site, including ones that actively block iframe embedding.
 */
export default function InteractiveCell({ url, full, color, deviceType = 'desktop' }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('Connecting…');

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const preset = DEVICE_PRESETS[deviceType] || DEVICE_PRESETS.desktop;
    // Desktop mode auto-fits the slot's real rendered size; Tablet/Mobile
    // force a fixed device viewport so the target site serves its actual
    // touch-optimized responsive layout.
    const rect = container.getBoundingClientRect();
    const size = preset.fixedSize || {
      width: Math.max(320, Math.round(rect.width)),
      height: Math.max(240, Math.round(rect.height))
    };
    canvas.width = size.width;
    canvas.height = size.height;

    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/ws/interact`);

    ws.onopen = () => ws.send(JSON.stringify({
      type: 'start',
      url,
      width: size.width,
      height: size.height,
      isMobile: preset.isMobile,
      hasTouch: preset.hasTouch,
      userAgent: preset.userAgent
    }));
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'ready') setStatus(null);
      else if (msg.type === 'error') setStatus(`Session error — ${msg.message}`);
      else if (msg.type === 'frame') {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        img.src = 'data:image/jpeg;base64,' + msg.data;
      }
    };
    ws.onerror = () => setStatus('Connection error');
    ws.onclose = () => setStatus((s) => s ?? 'Session ended');

    const toCanvasXY = (clientX, clientY) => {
      const r = canvas.getBoundingClientRect();
      return { x: ((clientX - r.left) / r.width) * canvas.width, y: ((clientY - r.top) / r.height) * canvas.height };
    };
    const send = (obj) => { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); };

    /* ---------- Mouse (desktop testing / any attached pointer device) ---------- */
    const onMouseMove = (e) => send({ type: 'mouseMove', ...toCanvasXY(e.clientX, e.clientY) });
    const onMouseDown = (e) => { canvas.focus(); send({ type: 'mouseDown', ...toCanvasXY(e.clientX, e.clientY), button: e.button === 2 ? 'right' : 'left' }); };
    const onMouseUp = (e) => send({ type: 'mouseUp', ...toCanvasXY(e.clientX, e.clientY), button: e.button === 2 ? 'right' : 'left' });
    const onContextMenu = (e) => e.preventDefault();
    const onWheel = (e) => { e.preventDefault(); send({ type: 'wheel', deltaY: e.deltaY }); };

    /* ---------- Touch (the primary input on a real kiosk touchscreen) ----------
     * Single-touch only: tap, drag, and scroll/swipe gestures all forward as
     * real touch events via CDP, so the target page gets native momentum
     * scrolling and press states — not synthesized mouse clicks. */
    const onTouchStart = (e) => {
      e.preventDefault();
      canvas.focus();
      const t = e.changedTouches[0];
      send({ type: 'touchStart', ...toCanvasXY(t.clientX, t.clientY) });
    };
    const onTouchMove = (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      send({ type: 'touchMove', ...toCanvasXY(t.clientX, t.clientY) });
    };
    const onTouchEnd = (e) => {
      e.preventDefault();
      send({ type: 'touchEnd' });
    };

    /* ---------- Keyboard ---------- */
    const onKeyDown = (e) => {
      e.preventDefault();
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) send({ type: 'type', text: e.key });
      else if (SPECIAL_KEY_MAP[e.key]) send({ type: 'keyDown', key: SPECIAL_KEY_MAP[e.key] });
    };
    const onKeyUp = (e) => { if (SPECIAL_KEY_MAP[e.key]) send({ type: 'keyUp', key: SPECIAL_KEY_MAP[e.key] }); };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('contextmenu', onContextMenu);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });
    canvas.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('keyup', onKeyUp);

    return () => {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
      canvas.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('keyup', onKeyUp);
      ws.close();
    };
  }, [url, deviceType]);

  return (
    <div className="h-full bg-[#0B1220]">
      <div className="h-8 flex items-center gap-2 px-3 font-bold text-[12px] text-white" style={{ background: color }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#5CF0A0] shadow-[0_0_6px_#5CF0A0] shrink-0" />
        <span className="truncate min-w-0">{full}</span>
        <span className="ml-auto shrink-0 text-[9px] bg-white/15 px-2 py-0.5 rounded-full tracking-wide">● INTERACTIVE</span>
      </div>
      <div ref={containerRef} className="relative w-full bg-black" style={{ height: 'calc(100% - 32px)' }}>
        <canvas
          ref={canvasRef}
          tabIndex={0}
          className="w-full h-full block outline-none cursor-crosshair"
          style={{ touchAction: 'none' }}
        />
        {status && (
          <div className="absolute inset-0 flex items-center justify-center text-white/70 text-[13px] font-semibold bg-black/35 pointer-events-none px-6 text-center">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
