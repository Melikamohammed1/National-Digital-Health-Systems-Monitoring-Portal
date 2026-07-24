import { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      login(username);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-center text-blue-500">Portal Login</h2>
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            className="w-full p-2.5 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-blue-500 text-white" 
            required 
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full p-2.5 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-blue-500 text-white" 
            required 
          />
        </div>
        <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 transition font-semibold rounded-lg">
          Sign In
        </button>
      </form>
    </div>
  );
}