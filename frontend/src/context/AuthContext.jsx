import { createContext, useCallback, useContext, useState } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'ndhs_auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; }
    catch { return null; }
  });

  /**
   * NOTE: this is a UI-only placeholder for the current frontend sprint —
   * there's no backend auth endpoint yet. Any non-empty username/password
   * signs in. The (username, password) => user shape is intentionally what
   * a real `POST /api/auth/login` call would look like, so swapping this
   * for a real request later is a small, contained change.
   */
  const login = useCallback(async (username, password) => {
    if (!username.trim() || !password.trim()) {
      throw new Error('Enter both a username and password');
    }
    const nextUser = { username: username.trim() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
