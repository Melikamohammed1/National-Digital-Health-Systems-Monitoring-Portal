import { useEffect, useRef, useState } from 'react';

const SPECIAL_KEY_MAP = {
  ' ': 'Space', Backspace: 'Backspace', Enter: 'Enter', Tab: 'Tab', Escape: 'Escape',
  ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight',
  Shift: 'Shift', Control: 'Control', Alt: 'Alt', Delete: 'Delete',
  Home: 'Home', End: 'End', PageUp: 'PageUp', PageDown: 'PageDown'
};

/**
 * Streams a live headless-browser tab and forwards mouse/keyboard input to it.
 * Nothing here is ever put in an <iframe> — the target site is rendered
 * server-side and shipped as JPEG frames, so embedding restrictions never
 * apply. Works even on sites that actively block framing.
 */
export default function InteractiveCell({ url, full, color }) {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('Connecting…');

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/ws/interact`);

    ws.onopen = () => ws.send(JSON.stringify({ type: 'start', url }));
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

    const toCanvasXY = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * canvas.width, y: ((e.clientY - r.top) / r.height) * canvas.height };
    };
    const send = (obj) => { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); };

    const onMouseMove = (e) => send({ type: 'mouseMove', ...toCanvasXY(e) });
    const onMouseDown = (e) => { canvas.focus(); send({ type: 'mouseDown', ...toCanvasXY(e), button: e.button === 2 ? 'right' : 'left' }); };
    const onMouseUp = (e) => send({ type: 'mouseUp', ...toCanvasXY(e), button: e.button === 2 ? 'right' : 'left' });
    const onContextMenu = (e) => e.preventDefault();
    const onWheel = (e) => { e.preventDefault(); send({ type: 'wheel', deltaY: e.deltaY }); };
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
    canvas.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('keyup', onKeyUp);

    return () => {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('keyup', onKeyUp);
      ws.close();
    };
  }, [url]);

  return (
    <div className="h-full bg-[#0B1220]">
      <div className="flex items-center gap-2 px-4 py-3 font-extrabold text-sm text-white" style={{ background: color }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#5CF0A0] shadow-[0_0_6px_#5CF0A0]" />
        {full}
        <span className="ml-auto text-[10px] bg-white/15 px-2.5 py-0.5 rounded-full tracking-wide">● INTERACTIVE</span>
      </div>
      <div className="relative w-full bg-black" style={{ height: 'calc(100% - 46px)' }}>
        <canvas ref={canvasRef} tabIndex={0} className="w-full h-full block outline-none cursor-crosshair" />
        {status && (
          <div className="absolute inset-0 flex items-center justify-center text-white/70 text-[13px] font-semibold bg-black/35 pointer-events-none">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
