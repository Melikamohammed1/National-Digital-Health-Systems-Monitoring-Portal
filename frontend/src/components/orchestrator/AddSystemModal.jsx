import { useState } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import { DEVICE_PRESETS } from '../../utils/devicePresets.js';

const MIN_REFRESH = 5;
const MAX_REFRESH = 300;

/** Same modal for both flows — pass `initial` (an existing target, with its
 *  `key`) to edit it in place; omit it to add a new one. `onSave` receives
 *  the same body shape either way, so the caller decides create vs. PATCH. */
export default function AddSystemModal({ onCancel, onSave, onError, initial }) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name || '');
  const [url, setUrl] = useState(initial?.rawUrl || initial?.url || '');
  const [mode, setMode] = useState(initial?.mode || 'interactive');
  const [deviceType, setDeviceType] = useState(initial?.deviceType || 'desktop');
  const [refreshSeconds, setRefreshSeconds] = useState(initial?.refreshSeconds || 8);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim() || !url.trim()) { onError('Enter a system name and URL'); return; }
    setBusy(true);
    try {
      await onSave({ name: name.trim(), url: url.trim(), mode, deviceType, refreshSeconds });
    } catch (err) {
      onError(err.message || `Could not ${isEdit ? 'save changes' : 'add system'}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit System / Website' : 'Add New System / Website'}
      subtitle={isEdit ? 'Changes apply immediately to every screen slot using this system.' : 'Loads live, via its real URL — fully clickable and touchable, not a screenshot.'}
      onClose={onCancel}
      maxWidth="460px"
      footer={<>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" disabled={busy} onClick={submit}>{isEdit ? 'Save Changes' : 'Add System'}</Button>
      </>}
    >
      <div>
        <label className="form-label">System Name</label>
        <input className="form-field" placeholder="e.g. Regional Bed Occupancy Tracker" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="form-label">Website URL</label>
        <input className="form-field" placeholder="https://example.gov/dashboard  (YouTube links work directly)" value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>
      <div>
        <label className="form-label">Display Mode</label>
        <select className="form-field" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="interactive">Interactive Remote Session (recommended — fully clickable & touchable, works on any site)</option>
          <option value="iframe">Live Embed (lighter-weight, only works if the site allows framing)</option>
          <option value="screenshot">Auto-Refresh Screenshot (lightest weight — periodic snapshot, not interactive)</option>
        </select>
      </div>
      {mode === 'interactive' && (
        <div>
          <label className="form-label">Touchscreen Layout</label>
          <select className="form-field" value={deviceType} onChange={(e) => setDeviceType(e.target.value)}>
            {Object.entries(DEVICE_PRESETS).map(([key, p]) => <option key={key} value={key}>{p.label}</option>)}
          </select>
        </div>
      )}
      {mode === 'screenshot' && (
        <div>
          <label className="form-label">Refresh Interval (seconds)</label>
          <input
            type="number"
            className="form-field"
            min={MIN_REFRESH}
            max={MAX_REFRESH}
            value={refreshSeconds}
            onChange={(e) => setRefreshSeconds(e.target.value)}
          />
        </div>
      )}
      <div className="callout">
        <b>Interactive Remote Session</b> drives a real browser tab on the server and streams it live — tap, scroll, and type on it during a demo, exactly like AnyDesk. Works even on sites that block embedding, since nothing is ever framed.<br /><br />
        <b>Touchscreen Layout</b>: Desktop auto-fits the slot's actual size. Tablet/Mobile force that site's touch-optimized responsive layout (bigger buttons, no hover-only menus) — the same layout a real phone/tablet visitor would get.<br /><br />
        <b>Live Embed</b> is a lighter-weight plain iframe — cheaper to run, but still fails on sites with JavaScript that detects and blocks framing.<br /><br />
        <b>Auto-Refresh Screenshot</b> is the cheapest option — a periodic snapshot on the interval you set (min {MIN_REFRESH}s), not clickable. Good for a dashboard that just needs to stay visible, not driven.
      </div>
    </Modal>
  );
}
