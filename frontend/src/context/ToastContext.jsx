import { createContext, useCallback, useContext, useState } from 'react';
import Toast from '../components/common/Toast.jsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [message, setMessage] = useState('');
  const [key, setKey] = useState(0);

  const toast = useCallback((msg) => {
    setMessage(msg);
    setKey((k) => k + 1);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <Toast key={key} message={message} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (ctx === null) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
