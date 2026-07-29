/** Shown in place of live-embed / interactive-session content while
 *  USE_MOCK is true (services/api.js) — those features need the real
 *  backend (the embedding proxy and the Puppeteer-driven WebSocket
 *  session), which isn't running yet in this frontend-only phase. */
export default function BackendRequiredNotice({ name, color, compact }) {
  if (compact) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-1 bg-[#111a2e] text-center px-1.5">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: color || '#5B6B8C' }} />
        <span className="text-[7px] font-bold text-white/70 leading-tight">Needs backend</span>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 bg-[#0B1220] text-center px-6">
      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: color || '#2F5FE0' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 5a3 3 0 0 1 6 0v3H9V7z" fill="#fff" />
        </svg>
      </div>
      <div className="text-white font-bold text-sm">{name}</div>
      <p className="text-white/50 text-[11.5px] max-w-[280px] leading-relaxed">
        This is a live/interactive target — it connects once the backend server is running.
        Until then, this is exactly what a real screen will show for it.
      </p>
    </div>
  );
}