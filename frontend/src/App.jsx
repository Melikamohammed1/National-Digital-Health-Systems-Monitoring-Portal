import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import Login from './pages/Login.jsx';
import Orchestrator from './pages/Orchestrator.jsx';
import LiveDisplay from './pages/LiveDisplay.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin/orchestrator" element={<ProtectedRoute><Orchestrator /></ProtectedRoute>} />
            {/* Not auth-protected on purpose — this is the URL a physical monitor's
                own browser loads directly, in kiosk mode, with no one signed in. */}
            <Route path="/display/:screenId" element={<LiveDisplay />} />
            <Route path="*" element={<Navigate to="/admin/orchestrator" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
