import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../common/Button.jsx';

export default function Sidebar({ targets, onAddSystem, onEditTarget, onRemoveTarget, onManageUsers, onViewActivity }) {
  const { user, isAdmin, logout } = useAuth();
  const targetEntries = Object.entries(targets);

  return (
    <aside className="w-[250px] shrink-0 bg-panel2 border-r border-border flex flex-col gap-4 p-3.5 sticky top-0 h-screen overflow-y-auto">
      <div className="flex items-center gap-2.5 px-0.5 pb-1">
        <div className="w-[34px] h-[34px] rounded-[9px] bg-accent flex items-center justify-center shrink-0 shadow-[0_4px_10px_-4px_rgba(47,95,224,0.6)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M2 12h4l2-7 4 14 3-9 2 5h5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="text-[11.5px] font-extrabold leading-tight tracking-wide">
          MOSAIC
          <span className="block text-accent">WALL</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 bg-white border border-border rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-inkDim">
        ⌘ Control Hub v3.5 — Orchestration Layer
      </div>

      <div>
        <div className="text-[10px] font-bold tracking-wider text-inkFaint uppercase mb-1 px-0.5">Navigation</div>
        <div className="flex flex-col gap-[3px] mt-1.5">
          <div className="flex items-center justify-between px-2.5 py-2 rounded-lg text-[12.5px] font-semibold bg-white text-accent shadow-[0_1px_2px_rgba(15,27,51,0.04),0_8px_24px_-12px_rgba(15,27,51,0.12)]">
            Screen Orchestrator <span className="text-[9.5px] font-bold bg-accent text-white px-1.5 py-0.5 rounded-full">Active</span>
          </div>
          {isAdmin && (
            <>
              <button
                onClick={onManageUsers}
                className="text-left px-2.5 py-2 rounded-lg text-[12.5px] font-semibold text-inkDim hover:bg-white hover:text-accent transition-colors"
              >
                Manage Users
              </button>
              <button
                onClick={onViewActivity}
                className="text-left px-2.5 py-2 rounded-lg text-[12.5px] font-semibold text-inkDim hover:bg-white hover:text-accent transition-colors"
              >
                Activity Log
              </button>
            </>
          )}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-bold tracking-wider text-inkFaint uppercase mb-1 px-0.5">Available Targets</div>
        <div className="mt-1.5">
          {targetEntries.length === 0 ? (
            <p className="text-[11px] text-inkFaint leading-relaxed px-0.5">
              None yet — use <b>Add New System / Website</b> below to register the first one.
            </p>
          ) : (
            targetEntries.map(([k, t]) => (
              <div key={k} className="group flex items-center gap-2 text-[11.5px] py-[5px] px-0.5 font-medium">
                <span className="w-[7px] h-[7px] rounded-sm shrink-0" style={{ background: t.color }} />
                <span className="truncate min-w-0">{t.name}</span>
                {isAdmin && (
                  <span className="ml-auto shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => onEditTarget(k)}
                      title={`Edit ${t.name}`}
                      className="text-inkFaint hover:text-accent font-bold text-[11px] leading-none px-1"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => onRemoveTarget(k)}
                      title={`Remove ${t.name}`}
                      className="text-inkFaint hover:text-crit font-bold text-[13px] leading-none px-1"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1" />

      {user && (
        <div className="flex items-center justify-between text-[11px] text-inkDim px-0.5">
          <span className="font-semibold">
            Signed in as {user.username}
            <span className={`ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isAdmin ? 'bg-accent text-white' : 'bg-border text-inkDim'}`}>
              {user.role}
            </span>
          </span>
          <button onClick={logout} className="text-accent font-bold hover:underline">Sign out</button>
        </div>
      )}
      {isAdmin && <Button variant="primary" block onClick={onAddSystem}>+ Add New System / Website</Button>}
    </aside>
  );
}
