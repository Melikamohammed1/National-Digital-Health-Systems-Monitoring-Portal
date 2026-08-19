import { useEffect, useState } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getUsers, createUser, deleteUser } from '../../services/api.js';

export default function UserManagementModal({ onClose, onError }) {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('viewer');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getUsers().then(setUsers).catch((err) => onError(err.message || 'Could not load users')).finally(() => setLoading(false));
  }, [onError]);

  async function addUser() {
    if (!username.trim() || !password.trim()) { onError('Enter a username and password'); return; }
    setBusy(true);
    try {
      const created = await createUser({ username: username.trim(), password: password.trim(), role });
      setUsers((prev) => [...prev, created]);
      setUsername('');
      setPassword('');
      setRole('viewer');
    } catch (err) {
      onError(err.message || 'Could not create user');
    } finally {
      setBusy(false);
    }
  }

  async function removeUser(id) {
    if (!window.confirm('Remove this account? They will no longer be able to sign in.')) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      onError(err.message || 'Could not remove user');
    }
  }

  return (
    <Modal
      title="Manage Users"
      subtitle="Administrators can create/edit/delete screens and systems. Viewers can sign in and see the dashboard, but every write action is blocked."
      onClose={onClose}
      maxWidth="480px"
      footer={<Button variant="ghost" onClick={onClose}>Close</Button>}
    >
      <div>
        <label className="form-label">Existing Accounts</label>
        {loading ? (
          <p className="text-[11.5px] text-inkFaint">Loading…</p>
        ) : (
          <div className="flex flex-col gap-1 mt-1">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-2 text-[12px] bg-panel2 border border-border rounded-md px-2.5 py-1.5">
                <span className="font-semibold">{u.username}</span>
                <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-accent text-white' : 'bg-border text-inkDim'}`}>
                  {u.role}
                </span>
                {u.id === me?.id && <span className="text-[10px] text-inkFaint">(you)</span>}
                <button
                  onClick={() => removeUser(u.id)}
                  title={`Remove ${u.username}`}
                  className="ml-auto text-inkFaint hover:text-crit font-bold text-[13px] leading-none px-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border pt-3.5">
        <label className="form-label">Add Account</label>
        <input className="form-field mb-2" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="form-field mb-2" type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
        <select className="form-field mb-2" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="viewer">Viewer — read-only dashboard access</option>
          <option value="admin">Administrator — full control</option>
        </select>
        <Button variant="primary" size="sm" disabled={busy} onClick={addUser}>+ Create Account</Button>
      </div>
    </Modal>
  );
}
