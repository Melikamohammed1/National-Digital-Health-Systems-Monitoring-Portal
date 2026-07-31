import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { gridDims } from '../utils/gridHelpers.js';
import { getScreen, getTargets } from '../services/api.js';
import { TARGETS as BUILTIN_TARGETS, buildTargetEntry } from '../services/mockDashboards.js';
import FullCell from '../components/display/FullCell.jsx';

export default function LiveDisplay() {
  const { screenId } = useParams();
  const navigate = useNavigate();
  const [screen, setScreen] = useState(null);
  const [targets, setTargets] = useState(BUILTIN_TARGETS);
  const [error, setError] = useState(false);

  // Initial load
  useEffect(() => {
    (async () => {
      try {
        const [scr, customTargets] = await Promise.all([getScreen(screenId), getTargets()]);
        setScreen(scr);
        const merged = { ...BUILTIN_TARGETS };
        Object.entries(customTargets).forEach(([key, t]) => { merged[key] = buildTargetEntry(t); });
        setTargets(merged);
      } catch {
        setError(true);
      }
    })();
  }, [screenId]);

  // Poll so this "physical screen" reflects admin pushes automatically —
  // no manual refresh needed on the monitor itself.
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const fresh = await getScreen(screenId);
        setScreen((current) => {
          if (!current) return fresh;
          if (JSON.stringify(fresh.slots) !== JSON.stringify(current.slots) || fresh.layout !== current.layout) {
            return fresh;
          }
          return current;
        });
        const customTargets = await getTargets();
        setTargets((prev) => {
          const merged = { ...BUILTIN_TARGETS };
          Object.entries(customTargets).forEach(([key, t]) => { merged[key] = buildTargetEntry(t); });
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

  return (
    <div className="fixed inset-0 bg-black">
      <div
        className="absolute inset-0 grid gap-[2px] bg-black"
        style={{ gridTemplateColumns: `repeat(${dims.cols},1fr)`, gridTemplateRows: `repeat(${dims.rows},1fr)` }}
      >
        {/* key includes slot content so React remounts (and reconnects) interactive cells when a slot's target changes */}
        {screen.slots.map((k, i) => (
          <div key={`${i}-${k}`} className="relative overflow-hidden bg-[#0B1220]">
            <FullCell targetKey={k} targets={targets} />
          </div>
        ))}
      </div>
      <div className="fixed bottom-0 right-0 w-[130px] h-[90px] z-[60] flex items-end justify-end p-3.5 group">
        <button
          onClick={() => navigate('/admin/orchestrator')}
          className="opacity-10 group-hover:opacity-100 transition-opacity bg-[rgba(15,20,35,0.85)] text-white
                     border border-white/25 px-3.5 py-2 rounded-full text-[11px] font-bold flex items-center gap-1.5 backdrop-blur"
        >
          ✕ Exit to Admin
        </button>
      </div>
    </div>
  );
}
