import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Header() {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-GB'));

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString('en-GB')), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex justify-end gap-4 items-center text-[11.5px] text-inkDim mb-4">
      <span>
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-ok mr-1.5 shadow-[0_0_0_3px_#E5FAEF]" />
        <b className="text-ink">System nominal</b>
      </span>
      <span className="font-mono">{time}</span>
      <span>{user?.username ? `${user.username}@moh.gov` : 'admin@moh.gov'}</span>
    </div>
  );
}
