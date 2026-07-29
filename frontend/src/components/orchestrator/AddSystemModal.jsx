import { useState } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';

export default function AddSystemModal({ onCancel, onCreate, onError }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState('interactive');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim() || !url.trim()) { onError('Enter a system name and URL'); return; }
    setBusy(true);
    try {
      await onCreate({ name: name.trim(), url: url.trim(), mode });
    } catch (err) {
      onError(err.message || 'Could not add system');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Add New System / Website"
      subtitle="Embed a dashboard someone else built — the portal loads it live, via its real URL."
      onClose={onCancel}
      maxWidth="440px"
      footer={<>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" disabled={busy} onClick={submit}>Add System</Button>
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
          <option value="interactive">Interactive Remote Session (recommended — fully clickable & typeable, works on any site)</option>
          <option value="iframe">Live Embed (lighter-weight, only works if the site allows framing)</option>
        </select>
      </div>
      <div className="callout">
        <b>Interactive Remote Session</b> drives a real headless browser tab on the server and streams it live — click, scroll, and type in it during a demo, exactly like AnyDesk. It works even on sites that actively block embedding, since nothing is ever framed. Heavier on the server (one real browser tab per active viewer). Requires <code>puppeteer</code> (see README).<br /><br />
        <b>Live Embed</b> is a normal iframe via the proxy, with YouTube/Vimeo links auto-converted to their official embeddable player. Cheaper to run, but still fails on sites with JavaScript that detects and blocks framing.
      </div>
    </Modal>
  );
}
