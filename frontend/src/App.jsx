import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Layout from './Layout';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

// Simple Placeholder Pages for Navigation
function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">System Dashboard</h2>
      <p className="text-slate-400 mb-6">Overview of current regional health system status.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm">Connected Facilities</p>
          <p className="text-3xl font-bold text-blue-400 mt-2">142</p>
        </div>
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm">System Uptime</p>
          <p className="text-3xl font-bold text-emerald-400 mt-2">99.8%</p>
        </div>
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm">Active Sync Alerts</p>
          <p className="text-3xl font-bold text-amber-400 mt-2">3</p>
        </div>
      </div>
    </div>
  );
}

function FacilitiesPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Health Facilities</h2>
      <p className="text-slate-400">Manage registered health centers and monitoring nodes.</p>
    </div>
  );
}

function MetricsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">System Metrics</h2>
      <p className="text-slate-400">Real-time telemetry data and server health logs.</p>
    </div>
  );
}

function SettingsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Settings</h2>
      <p className="text-slate-400">Configure system thresholds and account preferences.</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/facilities" element={<FacilitiesPage />} />
            <Route path="/metrics" element={<MetricsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}