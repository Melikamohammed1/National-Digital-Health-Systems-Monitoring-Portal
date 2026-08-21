import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { gridDims } from '../utils/gridHelpers.js';
import { getScreen, getTargets, heartbeatScreen } from '../services/api.js';
import { buildTargetEntry } from '../services/targetHelpers.js';
import FullCell from '../components/display/FullCell.jsx';

export default function LiveDisplay() {
  const { screenId } = useParams();
  const navigate = useNavigate();
  const [screen, setScreen] = useState(null);
  const [targets, setTargets] = useState({});
  const [error, setError] = useState(false);
  const [isTVMode, setIsTVMode] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [scr, customTargets] = await Promise.all([getScreen(screenId), getTargets()]);
        setScreen(scr);
        const merged = {};
        Object.entries(customTargets).forEach(([key, t]) => { merged[key] = buildTargetEntry(t); });
        setTargets(merged);
      } catch {
        setError(true);
      }
    })();
  }, [screenId]);

  // Proves to the backend this screen is actually up — this is what makes
  // its status real-time instead of a manually-set claim. See
  // Screen.sweepOffline on the backend for the other half.
  useEffect(() => {
    heartbeatScreen(screenId).catch(() => {});
    const t = setInterval(() => { heartbeatScreen(screenId).catch(() => {}); }, 15000);
    return () => clearInterval(t);
  }, [screenId]);

  // Poll so this "physical screen" reflects admin pushes automatically.
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const fresh = await getScreen(screenId);
        setScreen((current) => {
          if (!current) return fresh;
          if (
            JSON.stringify(fresh.slots) !== JSON.stringify(current.slots) ||
            JSON.stringify(fresh.slotSpans) !== JSON.stringify(current.slotSpans) ||
            fresh.layout !== current.layout
          ) {
            return fresh;
          }
          return current;
        });
        const customTargets = await getTargets();
        setTargets(() => {
          const merged = {};
          Object.entries(customTargets).forEach(([key, tgt]) => { merged[key] = buildTargetEntry(tgt); });
          return merged;
        });
      } catch { /* transient network errors are fine to ignore while polling */ }
    }, 4000);
    return () => clearInterval(t);
  }, [screenId]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') navigate('/admin/orchestrator'); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate]);

  // Tracks real browser fullscreen state — not just whatever we last set it
  // to. This fires on Esc (the browser exits fullscreen before any JS can
  // intervene) as much as it does on our own button click, so it's the only
  // reliable way to know TV Mode actually turned off.
  useEffect(() => {
    const onFullscreenChange = () => setIsTVMode(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  function toggleTVMode() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      // requestFullscreen needs a direct user gesture (this click qualifies)
      // and can reject if the browser/embedding context denies it — fail
      // quietly rather than throwing an unhandled rejection.
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  // In TV Mode the corner controls stay hidden until the mouse actually
  // moves, then fade back out after a few seconds of no movement — keeps
  // the screen clean for unattended viewing, same idea as a video player's
  // auto-hiding scrubber.
  useEffect(() => {
    if (!isTVMode) { setControlsVisible(true); return; }
    setControlsVisible(false);
    let hideTimer = null;
    const onMove = () => {
      setControlsVisible(true);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setControlsVisible(false), 3000);
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      clearTimeout(hideTimer);
    };
  }, [isTVMode]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white/70 text-sm font-semibold">
        Could not load screen "{screenId}" — check it's registered in the Orchestrator.
      </div>
    );
  }
  if (!screen) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center text-white/50 text-sm">Connecting…</div>;
  }

  const dims = gridDims(screen);
  const spans = (screen.slotSpans && screen.slotSpans.length === screen.slots.length) ? screen.slotSpans : screen.slots.map(() => 1);

  return (
    <div className="fixed inset-0 bg-black">
      <div
        className="absolute inset-0 grid gap-2.5 bg-black p-2.5"
        style={{ gridTemplateColumns: `repeat(${dims.cols},1fr)`, gridTemplateRows: `repeat(${dims.rows},1fr)` }}
      >
        {/* key includes slot content so React remounts (and reconnects) interactive cells when a slot's target changes */}
        {screen.slots.map((k, i) => (
          <div key={`${i}-${k}`} className="relative overflow-hidden bg-[#0B1220] rounded-xl" style={{ gridColumn: `span ${spans[i]}` }}>
            <FullCell targetKey={k} targets={targets} />
          </div>
        ))}
      </div>
      <div
        className={`fixed bottom-0 left-0 w-[150px] h-[90px] z-[60] flex items-end justify-start p-3.5 group
                     transition-opacity duration-500 ${isTVMode && !controlsVisible ? 'opacity-0 pointer-events-none' : ''}`}
      >
        <button
          onClick={toggleTVMode}
          className={`transition-opacity duration-500 bg-[rgba(15,20,35,0.85)] text-white
                      border border-white/25 px-3.5 py-2 rounded-full text-[11px] font-bold flex items-center gap-1.5 backdrop-blur
                      ${isTVMode ? 'opacity-100' : 'opacity-10 group-hover:opacity-100'}`}
        >
          {isTVMode ? '⤡ Exit TV Mode' : '⛶ TV Mode'}
        </button>
      </div>
      <div
        className={`fixed bottom-0 right-0 w-[150px] h-[90px] z-[60] flex items-end justify-end p-3.5 group
                     transition-opacity duration-500 ${isTVMode && !controlsVisible ? 'opacity-0 pointer-events-none' : ''}`}
      >
        <button
          onClick={() => navigate('/admin/orchestrator')}
          className={`transition-opacity duration-500 bg-[rgba(15,20,35,0.85)] text-white
                      border border-white/25 px-3.5 py-2 rounded-full text-[11px] font-bold flex items-center gap-1.5 backdrop-blur
                      ${isTVMode ? 'opacity-100' : 'opacity-10 group-hover:opacity-100'}`}
        >
          ✕ Exit to Admin
        </button>
      </div>
    </div>
  );
}
