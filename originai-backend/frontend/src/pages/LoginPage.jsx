import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/analyze');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={outer}>
      <div style={panel} className="fade-up">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={logoBox}>🔬</div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--snow)', marginBottom: 6 }}>Welcome back</h1>
          <p style={{ fontSize: 13, color: 'var(--snow-mute)' }}>Sign in to your OriginAI account</p>
        </div>

        {error && <div style={errorBox}>{error}</div>}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input name="email" type="email" value={form.email} onChange={handle}
              placeholder="you@university.edu" style={inputStyle} required autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input name="password" type="password" value={form.password} onChange={handle}
              placeholder="••••••••" style={inputStyle} required />
          </div>
          <Button type="submit" loading={loading} icon={<LogIn size={15} />}
            style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}>
            Sign in
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--snow-mute)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)' }}>Create one</Link>
        </p>

        {/* Demo shortcut */}
        <button onClick={() => setForm({ email: 'admin@originai.dev', password: 'AdminPass123!' })}
          style={{ display: 'block', margin: '16px auto 0', fontSize: 11, color: 'var(--snow-ghost)', fontFamily: 'var(--font-mono)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          Fill demo credentials
        </button>
      </div>
      <div style={bgGrid} />
    </div>
  );
}

const outer = {
  minHeight: '100vh', background: 'var(--dark)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 20, position: 'relative',
};
const panel = {
  background: 'var(--dark2)', border: '1px solid var(--border2)',
  borderRadius: 20, padding: '40px 36px',
  width: '100%', maxWidth: 420, position: 'relative', zIndex: 1,
};
const logoBox = {
  width: 52, height: 52, borderRadius: 14, margin: '0 auto 16px',
  background: 'linear-gradient(135deg, #58A6FF, #D2A8FF)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
};
const labelStyle = { display: 'block', fontSize: 12, color: 'var(--snow-mute)', marginBottom: 6 };
const inputStyle = {
  width: '100%', padding: '10px 13px', fontSize: 13,
  background: 'var(--dark3)', border: '1px solid var(--border2)',
  borderRadius: 'var(--radius-md)', color: 'var(--snow)',
};
const errorBox = {
  background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.25)',
  borderRadius: 'var(--radius-md)', padding: '10px 13px',
  fontSize: 13, color: 'var(--danger)', marginBottom: 16,
};
const bgGrid = {
  position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
  backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(88,166,255,0.06) 0%, transparent 60%)',
};
