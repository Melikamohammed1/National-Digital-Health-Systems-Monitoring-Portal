import { useState } from 'react';
import { useAuth } from './AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  // State management for systems, modal, online status, and notifications
  const [systems, setSystems] = useState([
    'DHIS2 Dashboard',
    'Power BI',
    'Grafana',
    'Metabase',
    'YouTube',
  ]);
  const [selectedSystem, setSelectedSystem] = useState('DHIS2 Dashboard');
  const [isOnline, setIsOnline] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);

  // Form State for Adding System
  const [systemName, setSystemName] = useState('');
  const [systemType, setSystemType] = useState('DHIS2 Dashboard');
  const [systemUrl, setSystemUrl] = useState('');

  const handleAddSystem = (e) => {
    e.preventDefault();
    if (systemName.trim()) {
      const newName = '${systemName} (${systemType})';
      setSystems([...systems, newName]);
      setSelectedSystem(newName);
      setSystemName('');
      setSystemUrl('');
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 text-white sticky top-0 z-10 gap-4">
        {/* Left Section: Logo & System Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">
              DH
            </div>
            <h1 className="font-semibold text-base hidden lg:block tracking-wide">
              Digital Health Portal
            </h1>
          </div>

          {/* System Selector Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-1.5">
            <span className="text-xs text-slate-400 font-medium">System:</span>
            <select
              value={selectedSystem}
              onChange={(e) => setSelectedSystem(e.target.value)}
              className="bg-transparent text-sm text-blue-400 font-semibold focus:outline-none cursor-pointer"
            >
              {systems.map((sys, idx) => (
                <option key={idx} value={sys} className="bg-slate-800 text-white">
                  {sys}
                </option>
              ))}
            </select>
          </div>

          {/* + Add System Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold rounded-lg transition shadow-sm"
          >
            <span className="text-base leading-none">+</span> Add System
          </button>
        </div>

        {/* Right Section: Status, Notifications & User */}
        <div className="flex items-center gap-5">
          {/* Network Status Toggle */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            className="flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-900/40 border border-slate-700/60 hover:bg-slate-700/40 transition cursor-pointer"
            title="Click to toggle status for testing"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span>{isOnline ? '🟢 Online' : '🔴 Offline'}</span>
          </button>

          {/* Notifications Bell */}
          <button 
            onClick={() => setNotificationCount(0)}
            className="relative p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700/50 transition"
            title="Notifications"
          >
            <span className="text-lg">🔔</span>
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full leading-none">
                {notificationCount}
              </span>
            )}
          </button>
          {/* User & Logout */}
          <div className="flex items-center gap-3 border-l border-slate-700 pl-4">
            <span className="text-xs text-slate-300 hidden sm:inline">
              <strong className="text-blue-400">{user?.username}</strong>
            </span>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-xs bg-red-600/80 hover:bg-red-600 text-white rounded-md transition font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Add System Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl text-white space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-blue-400">Register New System</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSystem} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">
                  System Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Central Regional Analytics"
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">
                  System Type
                </label>
                <select
                  value={systemType}
                  onChange={(e) => setSystemType(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white"
                >
                  <option value="DHIS2 Dashboard">DHIS2 Dashboard</option>
                  <option value="Power BI">Power BI</option>
                  <option value="Grafana">Grafana</option>
                  <option value="Metabase">Metabase</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Custom URL">Custom URL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">
                  Dashboard / Embed URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/dashboard"
                  value={systemUrl}
                  onChange={(e) => setSystemUrl(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 focus:outline-none focus:border-blue-500 text-sm text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-500 font-semibold rounded-lg transition shadow-md"
                >
                  Save System
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
  );
}