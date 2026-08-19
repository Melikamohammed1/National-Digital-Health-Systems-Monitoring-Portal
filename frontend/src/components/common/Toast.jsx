import { useEffect, useState } from 'react';

export default function Toast({ message }) {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!message) return;
    setText(message);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white px-4.5 py-2.5 rounded-lg
        text-[12.5px] font-semibold shadow-[0_12px_30px_-8px_rgba(0,0,0,0.4)] z-[200]
        transition-all duration-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}
    >
      {text}
    </div>
  );
}
