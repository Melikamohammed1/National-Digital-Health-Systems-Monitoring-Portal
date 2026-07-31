import { useEffect, useState } from 'react';
import { DASH, TAG_COLOR, TAG_BG } from '../../services/mockDashboards.js';
import { USE_MOCK } from '../../services/api.js';
import BackendRequiredNotice from '../common/BackendRequiredNotice.jsx';
import InteractiveCell from './InteractiveCell.jsx';

function LiveShot({ src, className, style }) {
  const [bust, setBust] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setBust(Date.now()), 8000);
    return () => clearInterval(t);
  }, []);
  return <img className={className} style={style} src={`${src}&t=${bust}`} loading="lazy" />;
}

export default function FullCell({ targetKey, targets }) {
  if (!targetKey || !targets[targetKey]) {
    return <div className="flex items-center justify-center h-full text-[#4A5876] text-[13px] font-bold">No source assigned</div>;
  }
  const t = targets[targetKey];

  // Custom targets (Add System / quick-browse) need the real backend —
  // the embedding proxy and the Puppeteer session both live there.
  if ((t.iframe || t.screenshot || t.interactive) && USE_MOCK) {
    return <BackendRequiredNotice name={t.full} color={t.color} />;
  }

  if (t.interactive) {
    return <InteractiveCell url={t.rawUrl} full={t.full} color={t.color} />;
  }

  if (t.iframe) {
    return (
      <div className="h-full" style={{ background: '#0B1220' }}>
        <FullBar t={t} label="● LIVE" bg={t.color} />
        <iframe
          className="w-full border-0 bg-white"
          style={{ height: 'calc(100% - 46px)' }}
          src={t.embedUrl}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    );
  }

  if (t.screenshot) {
    return (
      <div className="h-full" style={{ background: '#0B1220' }}>
        <FullBar t={t} label="● AUTO-REFRESH" bg={t.color} />
        <LiveShot src={t.shotUrl} className="w-full object-contain block bg-white" style={{ height: 'calc(100% - 46px)' }} />
      </div>
    );
  }

  const d = DASH[targetKey].full;
  return (
    <div className="h-full" style={{ background: t.color }}>
      <FullBar t={t} label="● LIVE" />
      <div className="px-4.5 pb-4.5 overflow-hidden" style={{ height: 'calc(100% - 46px)' }}>
        <div className="grid gap-2.5 mb-3.5" style={{ gridTemplateColumns: `repeat(${d.stats.length},1fr)` }}>
          {d.stats.map(([v, l], i) => (
            <div key={i} className="bg-white/[.06] rounded-[10px] px-3.5 py-3">
              <b className="block text-[22px] text-white font-extrabold">{v}</b>
              <span className="text-[10.5px] text-white/60 font-semibold">{l}</span>
            </div>
          ))}
        </div>
        <div className="text-[10px] font-extrabold tracking-wider text-white/45 uppercase mb-2.5">{d.list.title}</div>
        {d.list.rows.map(([label, val, tag], i) => (
          <div key={i} className="flex justify-between py-2 border-b border-white/10 text-xs text-white">
            <span className="text-white/50 font-medium">{label}</span>
            <b className="font-bold text-[10.5px] px-1.5 py-0.5 rounded" style={{ color: TAG_COLOR[tag], background: TAG_BG[tag] }}>{val}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function FullBar({ t, label, bg }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 font-extrabold text-sm text-white" style={bg ? { background: bg } : undefined}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#5CF0A0] shadow-[0_0_6px_#5CF0A0]" />
      {t.full}
      <span className="ml-auto text-[10px] bg-white/15 px-2.5 py-0.5 rounded-full tracking-wide">{label}</span>
    </div>
  );
}
