/** Turns a raw target record (from the API or mock store) into the shape
 *  components render. There's no built-in demo content anymore — every
 *  target the app knows about was added by a real "Add New System /
 *  Website" or quick-browse action. */
export function buildTargetEntry(t) {
  const interactive = t.mode === 'interactive';
  const iframe = t.mode === 'iframe';
  // screenshot: neither of the above — a periodic snapshot, refreshed on
  // its own configurable interval (see FullCell/MiniCell's LiveShot).
  return {
    name: t.name,
    full: t.name,
    color: t.color,
    mode: t.mode,
    iframe,
    interactive,
    deviceType: t.deviceType || 'desktop',
    refreshSeconds: t.refreshSeconds || 8,
    embedUrl: iframe ? `/api/proxy?url=${encodeURIComponent(t.url)}` : null,
    rawUrl: t.url,
    shotUrl: `/api/screenshot?url=${encodeURIComponent(t.url)}`
  };
}
