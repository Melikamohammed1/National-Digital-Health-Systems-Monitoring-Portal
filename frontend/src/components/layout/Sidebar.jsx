import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../common/Button.jsx';

export default function Sidebar({ targets, onLaunchRouter, onAddSystem }) {
  const { user, logout } = useAuth();

  return (
    <aside className="w-[250px] shrink-0 bg-panel2 border-r border-border flex flex-col gap-4 p-3.5 sticky top-0 h-screen overflow-y-auto">
      <div className="flex items-center gap-2.5 px-0.5 pb-1">
        <div className="w-[34px] h-[34px] rounded-[9px] bg-accent flex items-center justify-center shrink-0 shadow-[0_4px_10px_-4px_rgba(47,95,224,0.6)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M2 12h4l2-7 4 14 3-9 2 5h5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="text-[11.5px] font-extrabold leading-tight tracking-wide">
          NATIONAL DIGITAL
          <span className="block text-accent">HEALTH SYSTEMS</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 bg-white border border-border rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-inkDim">
        ⌘ Control Hub v3.5 — Orchestration Layer
      </div>

      <div className="border-[1.5px] border-dashed border-borderStrong rounded-lg px-2.5 py-2 text-[11px] text-inkFaint flex items-center gap-2 font-semibold">
        <span className="w-4 h-4 rounded bg-border shrink-0" /> Ministry of Health Logo
      </div>

      <div>
        <div className="text-[10px] font-bold tracking-wider text-inkFaint uppercase mb-1 px-0.5">Network Health</div>
        <MetricRow label="Global Latency" value="12 ms" />
        <MetricRow label="VPN Tunnel" value="Connected" />
        <MetricRow label="Bandwidth" value="120 Mbps" last />
      </div>

      <div>
        <div className="text-[10px] font-bold tracking-wider text-inkFaint uppercase mb-1 px-0.5">Navigation</div>
        <div className="flex flex-col gap-[3px] mt-1.5">
          <div className="flex items-center justify-between px-2.5 py-2 rounded-lg text-[12.5px] font-semibold bg-white text-accent shadow-[0_1px_2px_rgba(15,27,51,0.04),0_8px_24px_-12px_rgba(15,27,51,0.12)]">
            Screen Orchestrator <span className="text-[9.5px] font-bold bg-accent text-white px-1.5 py-0.5 rounded-full">Active</span>
          </div>
          <div className="px-2.5 py-2 rounded-lg text-[12.5px] font-semibold text-inkDim opacity-55">System Target Inventory</div>
          <div className="px-2.5 py-2 rounded-lg text-[12.5px] font-semibold text-inkDim opacity-55">Access Keys</div>
        </div>
      </div>

      <div>
        <div className="text-[10px] font-bold tracking-wider text-inkFaint uppercase mb-1 px-0.5">Available Targets</div>
        <div className="mt-1.5">
          {Object.entries(targets).map(([k, t]) => (
            <div key={k} className="flex items-center gap-2 text-[11.5px] py-[5px] px-0.5 font-medium">
              <span className="w-[7px] h-[7px] rounded-sm shrink-0" style={{ background: t.color }} />
              {t.name}
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-ok" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {user && (
        <div className="flex items-center justify-between text-[11px] text-inkDim px-0.5">
          <span className="font-semibold">Signed in as {user.username}</span>
          <button onClick={logout} className="text-accent font-bold hover:underline">Sign out</button>
        </div>
      )}
      <Button variant="primary" block onClick={onLaunchRouter}>⇲ Launch Master Router</Button>
      <Button variant="ghost" block onClick={onAddSystem}>+ Add New System / Website</Button>
    </aside>
  );
}

function MetricRow({ label, value, last }) {
  return (
    <div className={`flex justify-between items-center text-[11.5px] py-1.5 px-0.5 ${last ? '' : 'border-b border-border'}`}>
      <span className="flex items-center gap-1.5 text-inkDim font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-ok" />
        {label}
      </span>
      <span className="font-bold font-mono text-[11px]">{value}</span>
    </div>
  );
}
