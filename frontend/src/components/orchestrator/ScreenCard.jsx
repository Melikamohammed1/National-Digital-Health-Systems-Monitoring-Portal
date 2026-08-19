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

export default function ScreenCard({ screen: scr, targets, isAdmin, onUpdate, onPush, onReconnect, onDelete, onOpenClient, onQuickBrowse, toast }) {
  const [pushed, setPushed] = useState(false);
  const [quickInputs, setQuickInputs] = useState({});
  const [dragFrom, setDragFrom] = useState(null);
  const isOffline = scr.status === 'offline';
  const dims = gridDims(scr);
  const hasTargets = Object.keys(targets).length > 0;
  // Falls back to all-1s if a screen predates slotSpans or its length
  // hasn't caught up with a just-changed slot count yet.
  const spans = (scr.slotSpans && scr.slotSpans.length === scr.slots.length) ? scr.slotSpans : scr.slots.map(() => 1);

  function setLayout(newLayout) {
    const n = newLayout === 'custom' ? (scr.customCount || scr.slots.length || 2) : LAYOUTS[newLayout].n;
    const slots = Array.from({ length: n }, (_, i) => scr.slots[i] || null);
    const slotSpans = Array.from({ length: n }, (_, i) => spans[i] || 1);
    onUpdate({ layout: newLayout, slots, slotSpans });
  }
  function stepCustomCount(dir) {
    let n = scr.slots.length + (dir === 'inc' ? 1 : -1);
    n = Math.max(CUSTOM_MIN, Math.min(CUSTOM_MAX, n));
    const slots = Array.from({ length: n }, (_, i) => scr.slots[i] || null);
    const slotSpans = Array.from({ length: n }, (_, i) => spans[i] || 1);
    onUpdate({ slots, slotSpans, customCount: n });
  }
  function setSlot(i, value) {
    const slots = scr.slots.slice();
    slots[i] = value || null;
    onUpdate({ slots });
  }
  function setSpan(i, delta) {
    const next = spans.slice();
    next[i] = Math.max(1, Math.min(dims.cols, (next[i] || 1) + delta));
    onUpdate({ slotSpans: next });
  }
  // Native HTML5 drag-and-drop — no extra library needed just to let two
  // slots swap which target they show.
  function onDragStart(i) {
    setDragFrom(i);
  }
  function onDragOverSlot(e) {
    e.preventDefault();
  }
  function onDropSlot(i) {
    if (dragFrom === null || dragFrom === i) { setDragFrom(null); return; }
    const slots = scr.slots.slice();
    [slots[dragFrom], slots[i]] = [slots[i], slots[dragFrom]];
    onUpdate({ slots });
    setDragFrom(null);
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
        <div className={`px-4.5 py-4 md:border-r border-border ${(isOffline || !isAdmin) ? 'opacity-45 pointer-events-none' : ''}`}>
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

          <div className="field-label flex items-center gap-1.5">
            Slot Configuration <span className="text-inkFaint font-semibold normal-case tracking-normal">({scr.slots.length} slot{scr.slots.length > 1 ? 's' : ''} — drag ⠿ to rearrange{scr.layout === 'custom' ? ', +/− to resize' : ''})</span>
          </div>
          {!hasTargets && (
            <p className="text-[11px] text-inkFaint mb-3 leading-relaxed">
              No systems added yet — use the search bar below on any slot, or
              <b> + Add New System / Website</b> in the sidebar.
            </p>
          )}
          {scr.slots.map((val, i) => (
            <div
              key={i}
              className={`mb-2.5 rounded-md ${dragFrom === i ? 'opacity-40' : ''}`}
              onDragOver={onDragOverSlot}
              onDrop={() => onDropSlot(i)}
            >
              <div className="flex items-center gap-2.5 mb-1">
                <span
                  draggable
                  onDragStart={() => onDragStart(i)}
                  title="Drag to swap with another slot"
                  className="w-9 shrink-0 text-[10px] font-bold text-inkFaint cursor-grab active:cursor-grabbing select-none flex items-center gap-0.5"
                >
                  ⠿ {i + 1}
                </span>
                <select className={`slot-select ${!val ? 'text-inkFaint font-medium italic' : ''}`} value={val || ''} onChange={(e) => setSlot(i, e.target.value)}>
                  <option value="">— Empty — click to assign —</option>
                  {Object.entries(targets).map(([k, t]) => <option key={k} value={k}>{t.name}</option>)}
                </select>
                {scr.layout === 'custom' && (
                  <div className="flex items-center gap-1 shrink-0" title="Span (grid columns wide)">
                    <button
                      className="w-5 h-5 rounded border border-borderStrong bg-white text-accent font-extrabold text-[11px] flex items-center justify-center disabled:opacity-35"
                      disabled={spans[i] <= 1}
                      onClick={() => setSpan(i, -1)}
                    >−</button>
                    <span className="text-[10px] font-bold text-inkDim w-3 text-center">{spans[i]}</span>
                    <button
                      className="w-5 h-5 rounded border border-borderStrong bg-white text-accent font-extrabold text-[11px] flex items-center justify-center disabled:opacity-35"
                      disabled={spans[i] >= dims.cols}
                      onClick={() => setSpan(i, 1)}
                    >+</button>
                  </div>
                )}
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
              : scr.slots.map((k, i) => (
                <div key={i} style={{ gridColumn: `span ${spans[i]}` }}>
                  <MiniCell targetKey={k} targets={targets} />
                </div>
              ))}
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
            {isAdmin && (
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={onReconnect}>↻ Force Reconnect Display</Button>
                <Button variant="ghost" size="sm" className="text-crit" onClick={onDelete}>🗑 Delete</Button>
              </div>
            )}
          </>
        ) : (
          <>
            <span className="font-mono text-[10.5px] text-inkFaint">{location.origin}/display/{scr.id}</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={copyUrl}>⧉ Copy Screen URL</Button>
              {isAdmin && (
                <>
                  <button
                    className="btn btn-sm text-white"
                    style={{ background: pushed ? '#1F9D57' : '#2F5FE0' }}
                    onClick={handlePush}
                  >
                    {pushed ? '✓ Pushed' : '⚡ Push Changes Live'}
                  </button>
                  <Button variant="ghost" size="sm" className="text-crit" onClick={onDelete}>🗑 Delete</Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
