import { useEffect, useState } from 'react';
import { USE_MOCK } from '../../services/api.js';
import BackendRequiredNotice from '../common/BackendRequiredNotice.jsx';
import InteractiveCell from './InteractiveCell.jsx';

/** Screenshot-backed <img> that refreshes itself on a configurable interval
 *  (target.refreshSeconds — see AddSystemModal's "Refresh Interval" field). */
function LiveShot({ src, refreshMs, className, style }) {
  const [bust, setBust] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setBust(Date.now()), refreshMs);
    return () => clearInterval(t);
  }, [refreshMs]);
  return <img className={className} style={style} src={`${src}&t=${bust}`} loading="lazy" />;
}

export default function FullCell({ targetKey, targets }) {
  if (!targetKey || !targets[targetKey]) {
    return <div className="flex items-center justify-center h-full text-[#4A5876] text-[13px] font-bold">No source assigned</div>;
  }
  const t = targets[targetKey];

  if (USE_MOCK) {
    return <BackendRequiredNotice name={t.full} color={t.color} />;
  }

  if (t.interactive) {
    return <InteractiveCell url={t.rawUrl} full={t.full} color={t.color} deviceType={t.deviceType} />;
  }

  if (t.iframe) {
    return (
      <div className="h-full" style={{ background: '#0B1220' }}>
        <FullBar t={t} label="● LIVE" bg={t.color} />
        <iframe
          className="w-full border-0 bg-white"
          style={{ height: 'calc(100% - 32px)' }}
          src={t.embedUrl}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    );
  }

  // Neither interactive nor iframe — periodic-screenshot mode, refreshed
  // every t.refreshSeconds (configurable per target, see AddSystemModal).
  return (
    <div className="h-full" style={{ background: '#0B1220' }}>
      <FullBar t={t} label={`● AUTO-REFRESH ${t.refreshSeconds}s`} bg={t.color} />
      <LiveShot
        src={t.shotUrl}
        refreshMs={t.refreshSeconds * 1000}
        className="w-full object-contain block bg-white"
        style={{ height: 'calc(100% - 32px)' }}
      />
    </div>
  );
}

function FullBar({ t, label, bg }) {
  return (
    <div className="h-8 flex items-center gap-2 px-3 font-bold text-[12px] text-white" style={bg ? { background: bg } : undefined}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#5CF0A0] shadow-[0_0_6px_#5CF0A0] shrink-0" />
      <span className="truncate min-w-0">{t.full}</span>
      <span className="ml-auto shrink-0 text-[9px] bg-white/15 px-2 py-0.5 rounded-full tracking-wide">{label}</span>
    </div>
  );
}
