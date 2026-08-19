import { useEffect, useState } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import { getActivity } from '../../services/api.js';

const ACTION_LABEL = {
  login_success: 'Signed in',
  login_failed: 'Failed sign-in',
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  reconnect: 'Reconnected'
};
const ACTION_COLOR = {
  login_success: 'text-[#1F9D57]',
  login_failed: 'text-crit',
  create: 'text-[#1F9D57]',
  update: 'text-accent',
  delete: 'text-crit',
  reconnect: 'text-accent'
};

export default function ActivityLogModal({ onClose, onError }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActivity(150).then(setEntries).catch((err) => onError(err.message || 'Could not load activity log')).finally(() => setLoading(false));
  }, [onError]);

  return (
    <Modal
      title="Activity Log"
      subtitle="Every sign-in attempt and every create/update/delete action, newest first."
      onClose={onClose}
      maxWidth="560px"
      footer={<Button variant="ghost" onClick={onClose}>Close</Button>}
    >
      {loading ? (
        <p className="text-[11.5px] text-inkFaint">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-[11.5px] text-inkFaint">Nothing recorded yet.</p>
      ) : (
        <div className="max-h-[420px] overflow-y-auto flex flex-col gap-1">
          {entries.map((e) => (
            <div key={e.id} className="flex items-start gap-2 text-[11.5px] bg-panel2 border border-border rounded-md px-2.5 py-1.5">
              <span className="font-mono text-[10px] text-inkFaint shrink-0 w-[70px] pt-0.5">
                {new Date(e.timestamp).toLocaleTimeString('en-GB')}
              </span>
              <span className={`font-bold shrink-0 ${ACTION_COLOR[e.action] || 'text-inkDim'}`}>
                {ACTION_LABEL[e.action] || e.action}
              </span>
              <span className="flex-1 min-w-0">
                <span className="font-semibold">{e.username || 'unknown'}</span>
                {e.detail && <span className="text-inkDim"> — {e.detail}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
