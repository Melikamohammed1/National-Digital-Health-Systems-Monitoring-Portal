export default function Modal({ title, subtitle, onClose, children, footer, maxWidth = '420px' }) {
  return (
    <div
      className="fixed inset-0 bg-[rgba(10,18,36,0.45)] backdrop-blur-sm flex items-center justify-center z-[100] p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[14px] w-full shadow-[0_30px_70px_-20px_rgba(10,18,36,0.45)] overflow-hidden animate-pop" style={{ maxWidth }}>
        <div className="px-5 pt-4.5 pb-3.5 border-b border-border">
          <h2 className="m-0 text-base font-extrabold">{title}</h2>
          {subtitle && <p className="mt-1 mb-0 text-[11.5px] text-inkDim">{subtitle}</p>}
        </div>
        <div className="px-5 py-4.5 flex flex-col gap-3.5">{children}</div>
        {footer && <div className="flex justify-end gap-2.5 px-5 py-3.5 border-t border-border bg-panel2">{footer}</div>}
      </div>
    </div>
  );
}
