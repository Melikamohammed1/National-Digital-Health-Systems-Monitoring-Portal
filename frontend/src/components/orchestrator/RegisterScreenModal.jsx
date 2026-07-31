import { useState } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';

export default function RegisterScreenModal({ onCancel, onCreate, onError }) {
  const [name, setName] = useState('');
  const [layout, setLayout] = useState('2x2');
  const [passcode, setPasscode] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await onCreate({ name: name.trim() || 'Untitled Screen', layout, passcode: passcode.trim() || undefined });
    } catch (err) {
      onError(err.message || 'Could not register screen');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Register New Display Screen"
      subtitle="Connect a new physical monitor to the orchestration network."
      onClose={onCancel}
      footer={<>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" disabled={busy} onClick={submit}>Generate Screen Link</Button>
      </>}
    >
      <div>
        <label className="form-label">Display Alias / Friendly Name</label>
        <input className="form-field" placeholder="e.g. Main Corridor Monitor" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="form-label">Initial Default Grid Layout</label>
        <select className="form-field" value={layout} onChange={(e) => setLayout(e.target.value)}>
          <option value="single">Single (1×1)</option>
          <option value="2x2">2×2 Grid</option>
          <option value="custom">Custom (choose slot count)</option>
          <option value="3col">3-Column Split</option>
        </select>
      </div>
      <div>
        <label className="form-label">Security Passcode (Optional)</label>
        <input className="form-field" placeholder="Restrict unauthorized control" value={passcode} onChange={(e) => setPasscode(e.target.value)} />
      </div>
      <div className="callout">A unique display URL will be generated automatically. Open it on the target monitor's browser in full-screen (kiosk) mode to begin receiving content.</div>
    </Modal>
  );
}
