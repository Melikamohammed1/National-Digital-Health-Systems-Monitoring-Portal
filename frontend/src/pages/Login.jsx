import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        <input className="form-field mb-3.5" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" autoFocus />

        <label className="form-label">Password</label>
        <div className="relative mb-1.5">
          <input
            type={showPassword ? 'text' : 'password'}
            className="form-field pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-inkFaint hover:text-inkDim flex items-center justify-center w-5 h-5"
          >
            {showPassword ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18M10.6 10.7a2.5 2.5 0 003.5 3.5M9.4 5.5A10.6 10.6 0 0112 5c5.5 0 9 5 10 7-.5.9-1.7 2.7-3.5 4.2M6.4 6.8C4.6 8.1 3.3 9.9 2 12c1 2 4.5 7 10 7 1.4 0 2.6-.3 3.7-.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></svg>
            )}
          </button>
        </div>

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
