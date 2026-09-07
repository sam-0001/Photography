'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginOrSetup() {
  const [mode, setMode] = useState<'loading' | 'login' | 'setup'>('loading');
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Setup State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if an admin exists
    fetch('/api/admin/setup')
      .then(res => res.json())
      .then(data => {
        if (data.hasAdmin) {
          setMode('login');
        } else {
          setMode('setup');
        }
      })
      .catch(() => setMode('login')); // fallback to login on error
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred during login');
    }
    
    setLoading(false);
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, username, password })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        // Automatically log them in after setup
        handleLogin(e);
      } else {
        setError(data.error || 'Setup failed');
      }
    } catch (err) {
      setError('An error occurred during setup');
    }
    
    setLoading(false);
  };

  if (mode === 'loading') {
    return <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4"></div>;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-md w-full bg-white p-8 border border-[#e7e2db] shadow-xl">
        <h1 className="text-2xl mb-6 text-center text-[#1d1b18]" style={{ fontFamily: "'Bodoni Moda', serif" }}>
          {mode === 'setup' ? 'Studio First-Time Setup' : 'Admin Portal Login'}
        </h1>
        
        {mode === 'setup' && (
          <p className="text-sm text-center text-[#7b766f] mb-6">
            Welcome! Create your one-time master admin account below. Once created, this registration screen will permanently lock itself.
          </p>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={mode === 'setup' ? handleSetup : handleLogin} className="space-y-4">
          
          {mode === 'setup' && (
            <>
              <div>
                <label className="block text-xs uppercase tracking-widest font-semibold text-[#7b766f] mb-1">Full Name / Studio Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border border-[#ccc5bd] p-3 text-sm focus:outline-none focus:border-[#775927]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-semibold text-[#7b766f] mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-[#ccc5bd] p-3 text-sm focus:outline-none focus:border-[#775927]"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs uppercase tracking-widest font-semibold text-[#7b766f] mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border border-[#ccc5bd] p-3 text-sm focus:outline-none focus:border-[#775927]"
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest font-semibold text-[#7b766f] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-[#ccc5bd] p-3 text-sm focus:outline-none focus:border-[#775927]"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white p-3 text-xs uppercase tracking-[0.2em] font-semibold mt-4 hover:bg-[#333] transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : (mode === 'setup' ? 'Create Account & Login' : 'Sign In')}
          </button>
        </form>
      </div>
    </div>
  );
}
