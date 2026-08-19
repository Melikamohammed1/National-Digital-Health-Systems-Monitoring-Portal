import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(username, password);
      const dest = location.state?.from || '/admin/orchestrator';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Could not sign in');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-panel px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-[380px] bg-white border border-border rounded-2xl shadow-[0_1px_2px_rgba(15,27,51,0.04),0_8px_24px_-12px_rgba(15,27,51,0.12)] p-7">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-[10px] bg-accent flex items-center justify-center shrink-0 shadow-[0_4px_10px_-4px_rgba(47,95,224,0.6)]">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M2 12h4l2-7 4 14 3-9 2 5h5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div className="text-[12px] font-extrabold leading-tight">
            MOSAIC<span className="block text-accent">WALL</span>
          </div>
        </div>

        <h1 className="text-[18px] font-extrabold mb-1">Control Hub Sign In</h1>
        <p className="text-[12px] text-inkDim mb-5">Sign in to manage the Screen Orchestrator.</p>

        <label className="form-label">Username</label>
        <input className="form-field mb-3.5" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" autoFocus />

        <label className="form-label">Password</label>
        <input type="password" className="form-field mb-1.5" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />

        {error && <p className="text-[11.5px] text-crit font-semibold mt-2">{error}</p>}

        <button type="submit" disabled={busy} className="btn btn-primary btn-block mt-5">
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
        <p className="text-[10.5px] text-inkFaint mt-4 leading-relaxed">
          Sign-in is verified against the backend — the Orchestrator and its write actions require a valid session.
        </p>
      </form>
    </div>
  );
}
