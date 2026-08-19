import { useEffect, useState } from 'react';
import { USE_MOCK } from '../../services/api.js';
import BackendRequiredNotice from '../common/BackendRequiredNotice.jsx';

/** Screenshot-backed <img> that refreshes itself on a configurable interval
 *  (target.refreshSeconds — see AddSystemModal's "Refresh Interval" field). */
function LiveShot({ src, refreshMs, className }) {
  const [bust, setBust] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setBust(Date.now()), refreshMs);
    return () => clearInterval(t);
  }, [refreshMs]);
  return <img className={className} src={`${src}&t=${bust}`} loading="lazy" />;
}

export default function MiniCell({ targetKey, targets }) {
  if (!targetKey || !targets[targetKey]) {
    return (
      <div className="relative overflow-hidden bg-[#111a2e] flex items-center justify-center h-full">
        <span className="text-[8px] font-bold text-center text-[#4A5876] px-1">No source<br />assigned</span>
      </div>
    );
  }
  const t = targets[targetKey];

  // Every target needs the real backend — the embedding proxy and the
  // Puppeteer session both live there. Show a clear notice instead of a
  // broken iframe/canvas while running on mock data.
  if (USE_MOCK) {
    return <BackendRequiredNotice name={t.name} color={t.color} compact />;
  }

  if (t.iframe) {
    return (
      <div className="relative overflow-hidden h-full bg-[#0B1220]">
        <MiniBar t={t} bg={t.color} />
        <iframe
          className="w-[900%] h-[900%] border-0 origin-top-left pointer-events-none bg-white"
          style={{ transform: 'scale(.111)' }}
          src={t.embedUrl}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    );
  }

  // Interactive-mode (and genuine screenshot-mode) targets show the cheap
  // periodic screenshot in the thumbnail — never a live Puppeteer session,
  // that would be wasteful for a tiny preview nobody's driving.
  return (
    <div className="relative overflow-hidden h-full bg-[#0B1220]">
      <MiniBar t={t} bg={t.color} />
      <LiveShot src={t.shotUrl} refreshMs={t.refreshSeconds * 1000} className="w-full h-full object-cover block bg-white" />
    </div>
  );
}

function MiniBar({ t, bg }) {
  return (
    <div
      className="flex items-center gap-1 text-[5.6px] font-extrabold text-white px-[5px] py-[3px] whitespace-nowrap overflow-hidden text-ellipsis"
      style={bg ? { background: bg } : undefined}
    >
      <span className="w-[3px] h-[3px] rounded-full bg-white shadow-[0_0_3px_#fff] shrink-0" />
      {t.name}
    </div>
  );
}
