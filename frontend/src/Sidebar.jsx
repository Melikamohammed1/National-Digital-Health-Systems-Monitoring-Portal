import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Health Facilities', path: '/facilities' },
    { label: 'System Metrics', path: '/metrics' },
    { label: 'Settings', path: '/settings' },
  ];

  return (
    <aside className="w-64 bg-slate-800/50 border-r border-slate-700 text-slate-300 flex flex-col p-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-3">
        Navigation
      </p>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `block px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow'
                  : 'hover:bg-slate-700/50 hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}