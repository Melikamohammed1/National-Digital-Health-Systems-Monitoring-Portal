import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);
const USER_KEY = 'ndhs_auth_user';
const TOKEN_KEY = 'ndhs_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) || null; }
    catch { return null; }
  });

  // A token can outlive its validity (expiry, server restart with a new
  // JWT_SECRET) even while still sitting in localStorage — check it once
  // on load and drop the session if the backend no longer accepts it.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      // No token — any cached user here is leftover from the old
      // placeholder auth (pre-dating real login) and isn't backed by an
      // actual session. Clear it so the UI doesn't show as signed in
      // while every write silently 401s.
      if (localStorage.getItem(USER_KEY)) {
        localStorage.removeItem(USER_KEY);
        setUser(null);
      }
      return;
    }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error('stale session');
        return res.json();
      })
      .then(({ user: freshUser }) => {
        localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
        setUser(freshUser);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      });
  }, []);

  const login = useCallback(async (username, password) => {
    if (!username.trim() || !password.trim()) {
      throw new Error('Enter both a username and password');
    }
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password: password.trim() })
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Could not sign in');
    }
    const { token, user: nextUser } = await res.json();
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    // Stateless JWT — nothing server-side to invalidate, but call it
    // anyway so the backend has a real request to log if that's ever added.
    if (token) fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isAdmin: user?.role === 'admin', login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
