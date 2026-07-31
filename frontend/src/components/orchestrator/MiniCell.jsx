import { useEffect, useState } from 'react';
import { DASH } from '../../services/mockDashboards.js';
import { USE_MOCK } from '../../services/api.js';
import BackendRequiredNotice from '../common/BackendRequiredNotice.jsx';

/** Screenshot-backed <img> that refreshes itself every 8s (matches server cache TTL). */
function LiveShot({ src, className }) {
  const [bust, setBust] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setBust(Date.now()), 8000);
    return () => clearInterval(t);
  }, []);
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

  // Custom targets (Add System / quick-browse) need the real backend —
  // the embedding proxy and the Puppeteer session both live there.
  if ((t.iframe || t.screenshot || t.interactive) && USE_MOCK) {
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

  // interactive-mode targets show the cheap periodic screenshot in the thumbnail
  if (t.screenshot || t.interactive) {
    return (
      <div className="relative overflow-hidden h-full bg-[#0B1220]">
        <MiniBar t={t} bg={t.color} />
        <LiveShot src={t.shotUrl} className="w-full h-full object-cover block bg-white" />
      </div>
    );
  }

  const d = DASH[targetKey];
  return (
    <div className="relative overflow-hidden h-full" style={{ background: t.color }}>
      <MiniBar t={t} />
      <div className="flex gap-[3px] px-[5px]">
        {d.stats.map(([v, l], i) => (
          <div key={i} className="bg-white/10 rounded-[3px] px-1 py-[3px] flex-1 min-w-0">
            <b className="block text-[6.5px] text-white font-extrabold">{v}</b>
            <span className="text-[4.6px] text-white/65 font-semibold">{l}</span>
          </div>
        ))}
      </div>
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
