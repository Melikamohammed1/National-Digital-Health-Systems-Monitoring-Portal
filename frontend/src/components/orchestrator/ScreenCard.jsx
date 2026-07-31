import { useState } from 'react';
import { LAYOUTS, CUSTOM_MIN, CUSTOM_MAX, gridDims } from '../../utils/gridHelpers.js';
import StatusBadge from '../common/StatusBadge.jsx';
import Button from '../common/Button.jsx';
import MiniCell from './MiniCell.jsx';

const LAYOUT_ICON = {
  single: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" /></svg>,
  '2x2': <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" /><rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" /><rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" /><rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" /></svg>,
  '3col': <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2" width="3.6" height="12" rx="1" stroke="currentColor" strokeWidth="1.4" /><rect x="6.2" y="2" width="3.6" height="12" rx="1" stroke="currentColor" strokeWidth="1.4" /><rect x="10.9" y="2" width="3.6" height="12" rx="1" stroke="currentColor" strokeWidth="1.4" /></svg>,
  custom: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="7" height="12" rx="1" stroke="currentColor" strokeWidth="1.4" /><rect x="10.5" y="2" width="3.5" height="12" rx="1" stroke="currentColor" strokeWidth="1.4" /></svg>
};

export default function ScreenCard({ screen: scr, targets, onUpdate, onPush, onReconnect, onOpenClient, onQuickBrowse, toast }) {
  const [pushed, setPushed] = useState(false);
  const [quickInputs, setQuickInputs] = useState({});
  const isOffline = scr.status === 'offline';
  const dims = gridDims(scr);

  function setLayout(newLayout) {
    const n = newLayout === 'custom' ? (scr.customCount || scr.slots.length || 2) : LAYOUTS[newLayout].n;
    const slots = Array.from({ length: n }, (_, i) => scr.slots[i] || null);
    onUpdate({ layout: newLayout, slots });
  }
  function stepCustomCount(dir) {
    let n = scr.slots.length + (dir === 'inc' ? 1 : -1);
    n = Math.max(CUSTOM_MIN, Math.min(CUSTOM_MAX, n));
    const slots = Array.from({ length: n }, (_, i) => scr.slots[i] || null);
    onUpdate({ slots, customCount: n });
  }
  function setSlot(i, value) {
    const slots = scr.slots.slice();
    slots[i] = value || null;
    onUpdate({ slots });
  }
  function handleQuickSubmit(i) {
    const val = (quickInputs[i] || '').trim();
    if (!val) return;
    onQuickBrowse(i, val);
    setQuickInputs((prev) => ({ ...prev, [i]: '' }));
  }
  async function handlePush() {
    await onPush();
    setPushed(true);
    setTimeout(() => setPushed(false), 1400);
  }
  function copyUrl() {
    const url = `${location.origin}/display/${scr.id}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    toast('Screen URL copied to clipboard');
  }

  return (
    <div className={`card ${isOffline ? 'opacity-90' : ''}`}>
      <div className="flex justify-between items-start px-4.5 pt-4 pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="m-0 text-[15.5px] font-extrabold">{scr.name}</h3>
            <span className="id-chip">ID: {scr.id}</span>
          </div>
          <div className="text-[11.5px] text-inkDim mt-1 flex items-center gap-1.5">
            {scr.location} · {scr.ip} · {scr.res}
          </div>
        </div>
        <StatusBadge status={scr.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_250px] border-t border-border">
        <div className={`px-4.5 py-4 md:border-r border-border ${isOffline ? 'opacity-45 pointer-events-none' : ''}`}>
          <div className="field-label">Layout</div>
          <div className="flex gap-1.5 flex-wrap mb-4">
            {Object.entries(LAYOUTS).map(([key, l]) => {
              const label = key === 'custom' ? `Custom (${scr.layout === 'custom' ? scr.slots.length : (scr.customCount || 2)})` : l.label;
              return (
                <button key={key} className={`layout-opt ${scr.layout === key ? 'sel' : ''}`} onClick={() => setLayout(key)}>
                  {LAYOUT_ICON[key]} {label}
                </button>
              );
            })}
          </div>

          {scr.layout === 'custom' && (
            <div className="flex items-center justify-between bg-panel2 border border-border rounded-lg px-2.5 py-2 mb-3.5">
              <span className="text-[11.5px] font-bold text-inkDim">Number of Slots</span>
              <div className="flex items-center gap-2.5">
                <button
                  className="w-6 h-6 rounded-md border border-borderStrong bg-white text-accent font-extrabold flex items-center justify-center disabled:opacity-35"
                  disabled={scr.slots.length <= CUSTOM_MIN}
                  onClick={() => stepCustomCount('dec')}
                >−</button>
                <span className="font-extrabold text-[13px] min-w-[16px] text-center">{scr.slots.length}</span>
                <button
                  className="w-6 h-6 rounded-md border border-borderStrong bg-white text-accent font-extrabold flex items-center justify-center disabled:opacity-35"
                  disabled={scr.slots.length >= CUSTOM_MAX}
                  onClick={() => stepCustomCount('inc')}
                >+</button>
              </div>
            </div>
          )}

          <div className="field-label">
            Slot Configuration <span className="text-inkFaint font-semibold normal-case tracking-normal">({scr.slots.length} slot{scr.slots.length > 1 ? 's' : ''})</span>
          </div>
          {scr.slots.map((val, i) => (
            <div key={i} className="mb-2.5">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-[10px] font-bold text-inkFaint w-9 shrink-0">Slot {i + 1}</span>
                <select className={`slot-select ${!val ? 'text-inkFaint font-medium italic' : ''}`} value={val || ''} onChange={(e) => setSlot(i, e.target.value)}>
                  <option value="">— Empty — click to assign —</option>
                  {Object.entries(targets).map(([k, t]) => <option key={k} value={k}>{t.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-9 shrink-0" />
                <input
                  className="flex-1 border border-border rounded-md px-2.5 py-1.5 text-[11px] bg-white placeholder:text-inkFaint disabled:opacity-50"
                  placeholder="🔍 …or type a search / URL to browse live in this slot"
                  value={quickInputs[i] || ''}
                  onChange={(e) => setQuickInputs((prev) => ({ ...prev, [i]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleQuickSubmit(i); } }}
                  disabled={isOffline}
                />
                <button className="btn btn-ghost btn-sm shrink-0" disabled={isOffline} onClick={() => handleQuickSubmit(i)}>Go</button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-4 bg-panel">
          <div className="field-label mb-2">Live Preview</div>
          <div
            className={`bg-[#0B1220] rounded-lg overflow-hidden border border-[#0B1220] grid gap-[2px] aspect-video ${isOffline ? 'flex items-center justify-center text-[#5C6B8A] text-[10px] font-semibold' : ''}`}
            style={!isOffline ? { gridTemplateColumns: `repeat(${dims.cols},1fr)`, gridTemplateRows: `repeat(${dims.rows},1fr)` } : undefined}
          >
            {isOffline
              ? <span>Signal lost</span>
              : scr.slots.map((k, i) => <MiniCell key={i} targetKey={k} targets={targets} />)}
          </div>
          <div className="mt-2.5">
            <button
              disabled={isOffline}
              onClick={onOpenClient}
              className="bg-transparent border-none text-accent text-[11px] font-bold flex items-center gap-1 hover:underline disabled:opacity-40 disabled:no-underline"
            >
              ⤢ Open Client View
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-4.5 py-3.5 border-t border-border gap-3 flex-wrap">
        {isOffline ? (
          <>
            <div className="text-[11.5px] text-inkDim">⏱ Last seen {scr.lastSeen || '—'}</div>
            <Button variant="primary" size="sm" onClick={onReconnect}>↻ Force Reconnect Display</Button>
          </>
        ) : (
          <>
            <span className="font-mono text-[10.5px] text-inkFaint">{location.origin}/display/{scr.id}</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={copyUrl}>⧉ Copy Screen URL</Button>
              <button
                className="btn btn-sm text-white"
                style={{ background: pushed ? '#1F9D57' : '#2F5FE0' }}
                onClick={handlePush}
              >
                {pushed ? '✓ Pushed' : '⚡ Push Changes Live'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
