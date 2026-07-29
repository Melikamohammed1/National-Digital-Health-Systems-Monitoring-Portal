export const STATUS_META = {
  online:  { label: 'ONLINE',  badge: 'bg-okDim text-[#1F9D57]', dot: 'bg-ok' },
  standby: { label: 'STANDBY', badge: 'bg-warnDim text-[#96780A]', dot: 'bg-warn' },
  offline: { label: 'OFFLINE', badge: 'bg-critDim text-[#C0392B]', dot: 'bg-crit' }
};

export default function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.offline;
  return <span className={`status-badge ${m.badge}`}>{m.label}</span>;
}