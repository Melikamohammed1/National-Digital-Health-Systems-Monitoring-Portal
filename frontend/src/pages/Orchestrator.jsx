import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/layout/Sidebar.jsx';
import Header from '../components/layout/Header.jsx';
import ScreenCard from '../components/orchestrator/ScreenCard.jsx';
import RegisterScreenModal from '../components/orchestrator/RegisterScreenModal.jsx';
import AddSystemModal from '../components/orchestrator/AddSystemModal.jsx';
import UserManagementModal from '../components/orchestrator/UserManagementModal.jsx';
import ActivityLogModal from '../components/orchestrator/ActivityLogModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { buildTargetEntry } from '../services/targetHelpers.js';
import { getScreens, getTargets, createScreen, patchScreen, reconnectScreen, deleteScreen, createTarget, updateTarget, deleteTarget, USE_MOCK } from '../services/api.js';
import { toBrowseUrl } from '../utils/urlHelpers.js';

export default function Orchestrator() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const [screens, setScreens] = useState([]);
  const [customTargets, setCustomTargets] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  // null = closed, 'new' = Add System modal, a target key = editing that target.
  const [targetModal, setTargetModal] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, t] = await Promise.all([getScreens(), getTargets()]);
        setScreens(s);
        setCustomTargets(t);
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const targets = useMemo(() => {
    const merged = {};
    Object.entries(customTargets).forEach(([key, t]) => { merged[key] = buildTargetEntry(t); });
    return merged;
  }, [customTargets]);

  async function updateScreen(id, patch) {
    setScreens((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    try { await patchScreen(id, patch); }
    catch { toast('Could not save changes to the server'); }
  }

  async function pushChanges(id) {
    const scr = screens.find((s) => s.id === id);
    try {
      await patchScreen(id, { layout: scr.layout, slots: scr.slots, slotSpans: scr.slotSpans });
      toast(`Changes pushed live to ${id} — any open client view will pick this up within a few seconds`);
    } catch {
      toast('Push failed — changes were not saved to the server');
    }
  }

  async function doReconnect(id) {
    toast(`Attempting to reconnect ${id}…`);
    try {
      const updated = await reconnectScreen(id);
      setScreens((prev) => prev.map((s) => (s.id === id ? updated : s)));
      toast(`${updated.name} is back online`);
    } catch {
      toast('Reconnect failed');
    }
  }

  async function removeScreen(id) {
    const scr = screens.find((s) => s.id === id);
    if (!scr) return;
    if (!window.confirm(`Delete "${scr.name}"? This removes it permanently and can't be undone.`)) return;
    try {
      await deleteScreen(id);
      setScreens((prev) => prev.filter((s) => s.id !== id));
      toast(`${scr.name} deleted`);
    } catch (err) {
      toast(err.message || 'Could not delete screen');
    }
  }

  async function removeTarget(key) {
    const t = customTargets[key];
    if (!t) return;
    if (!window.confirm(`Remove "${t.name}"? Any screen slot currently showing it will fall back to "No source assigned".`)) return;
    try {
      await deleteTarget(key);
      setCustomTargets((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      toast(`${t.name} removed`);
    } catch (err) {
      toast(err.message || 'Could not remove system');
    }
  }

  async function registerScreen({ name, layout, passcode }) {
    const screen = await createScreen({ name, layout, passcode });
    setScreens((prev) => [...prev, screen]);
    setShowRegister(false);
    toast(`${name} registered — screen link generated`);
  }

  async function saveSystem({ name, url, mode, deviceType, refreshSeconds }) {
    const editingKey = targetModal !== 'new' ? targetModal : null;
    if (editingKey) {
      const t = await updateTarget(editingKey, { name, url, mode, deviceType, refreshSeconds });
      setCustomTargets((prev) => ({ ...prev, [editingKey]: t }));
      toast(`${name} updated`);
    } else {
      const t = await createTarget({ name, url, mode, deviceType, refreshSeconds });
      setCustomTargets((prev) => ({ ...prev, [t.key]: t }));
      toast(t.note ? `${name} added — ${t.note}` : `${name} added — assign it to a slot below`);
    }
    setTargetModal(null);
  }

  async function quickBrowse(screenId, slotIndex, input) {
    const url = toBrowseUrl(input);
    const label = input.length > 28 ? input.slice(0, 28) + '…' : input;
    try {
      const t = await createTarget({ name: `Search: ${label}`, url, mode: 'interactive', deviceType: 'desktop' });
      setCustomTargets((prev) => ({ ...prev, [t.key]: t }));
      const scr = screens.find((s) => s.id === screenId);
      const slots = scr.slots.slice();
      slots[slotIndex] = t.key;
      await updateScreen(screenId, { slots });
      toast(`Now browsing "${input}" in Slot ${slotIndex + 1} — open Client View to drive it live`);
    } catch (err) {
      toast(err.message || 'Could not start browsing session');
    }
  }

  function openClientView(screenId) {
    window.open(`/display/${screenId}`, '_blank', 'noopener');
  }

  const online = screens.filter((s) => s.status === 'online').length;
  const standby = screens.filter((s) => s.status === 'standby').length;
  const offline = screens.filter((s) => s.status === 'offline').length;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        targets={targets}
        onAddSystem={() => setTargetModal('new')}
        onEditTarget={(key) => setTargetModal(key)}
        onRemoveTarget={removeTarget}
        onManageUsers={() => setShowUsers(true)}
        onViewActivity={() => setShowActivity(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 min-w-0 px-6 md:px-7 pt-5.5 pb-16">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="md:hidden mb-4 w-9 h-9 rounded-lg border border-border bg-white flex items-center justify-center text-ink shadow-[0_1px_2px_rgba(15,27,51,0.04)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <Header />

        <div className="flex justify-between items-start flex-wrap gap-3.5 mb-5.5">
          <div>
            <h1 className="text-[21px] m-0 mb-1.5 font-extrabold tracking-tight">Dynamic Screen Orchestrator</h1>
            <div className="flex gap-3.5 items-center text-[12.5px] text-inkDim font-semibold flex-wrap">
              <span>{screens.length} Screens Registered</span><span className="text-borderStrong">·</span>
              <span className="text-[#1F9D57]">● {online} Online</span><span className="text-borderStrong">·</span>
              <span className="text-[#96780A]">● {standby} Standby</span><span className="text-borderStrong">·</span>
              <span className="text-[#C0392B]">● {offline} Offline</span>
            </div>
          </div>
          {isAdmin && <button className="btn btn-outline" onClick={() => setShowRegister(true)}>+ Register New Physical Screen</button>}
        </div>

        {USE_MOCK && (
          <div className="flex items-center gap-2 bg-warnDim border border-[#F1C40F]/40 text-[#96780A] text-[11.5px] font-semibold px-3 py-2 rounded-lg mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-warn" />
            Running on mock data — no backend connected. Screens/targets reset on page reload. Set <code className="font-mono">USE_MOCK = false</code> in <code className="font-mono">src/services/api.js</code> once the backend is running.
          </div>
        )}

        {loading && <div className="text-inkDim text-sm py-16 text-center">Loading…</div>}
        {!loading && loadError && (
          <div className="text-inkDim text-sm py-16 text-center max-w-md mx-auto">
            Could not reach the backend at <code>/api/screens</code>. Make sure the server is running (<code>npm start</code> in the project root).
          </div>
        )}
        {!loading && !loadError && screens.length === 0 && (
          <div className="text-center py-20 text-inkDim">
            <p className="text-sm font-semibold mb-1">No screens registered yet.</p>
            <p className="text-[12.5px]">Click <b>+ Register New Physical Screen</b> above to add the first one.</p>
          </div>
        )}
        {!loading && !loadError && screens.map((scr) => (
          <ScreenCard
            key={scr.id}
            screen={scr}
            targets={targets}
            isAdmin={isAdmin}
            onUpdate={(patch) => updateScreen(scr.id, patch)}
            onPush={() => pushChanges(scr.id)}
            onReconnect={() => doReconnect(scr.id)}
            onDelete={() => removeScreen(scr.id)}
            onOpenClient={() => openClientView(scr.id)}
            onQuickBrowse={(slotIndex, input) => quickBrowse(scr.id, slotIndex, input)}
            toast={toast}
          />
        ))}
      </main>

      {showRegister && <RegisterScreenModal onCancel={() => setShowRegister(false)} onCreate={registerScreen} onError={toast} />}
      {targetModal && (
        <AddSystemModal
          onCancel={() => setTargetModal(null)}
          onSave={saveSystem}
          onError={toast}
          initial={targetModal !== 'new' ? targets[targetModal] : null}
        />
      )}
      {showUsers && <UserManagementModal onClose={() => setShowUsers(false)} onError={toast} />}
      {showActivity && <ActivityLogModal onClose={() => setShowActivity(false)} onError={toast} />}
    </div>
  );
}
