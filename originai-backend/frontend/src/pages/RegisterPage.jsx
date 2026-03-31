import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common';
import { UserPlus } from 'lucide-react';

const DOMAINS = [
  'Computer Science & AI', 'Biotechnology', 'Mechanical Engineering',
  'Medicine & Health', 'Physics', 'Chemistry', 'Social Sciences', 'Other',
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'student', institution: '', domain: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form);
      navigate('/analyze');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={outer}>
      <div style={panel} className="fade-up">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={logoBox}>🔬</div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--snow)', marginBottom: 4 }}>Create your account</h1>
          <p style={{ fontSize: 13, color: 'var(--snow-mute)' }}>Join OriginAI — check your research originality</p>
        </div>

        {error && <div style={errorBox}>{error}</div>}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Full name</label>
              <input name="name" value={form.name} onChange={handle} placeholder="Dr. Jane Smith"
                style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <select name="role" value={form.role} onChange={handle} style={inputStyle}>
                <option value="student">Student</option>
                <option value="researcher">Researcher</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input name="email" type="email" value={form.email} onChange={handle}
              placeholder="you@university.edu" style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input name="password" type="password" value={form.password} onChange={handle}
              placeholder="Min. 8 characters" style={inputStyle} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Institution</label>
              <input name="institution" value={form.institution} onChange={handle}
                placeholder="MIT, IIT Delhi…" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Primary domain</label>
              <select name="domain" value={form.domain} onChange={handle} style={inputStyle}>
                <option value="">Select…</option>
                {DOMAINS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <Button type="submit" loading={loading} icon={<UserPlus size={15} />}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            Create account
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--snow-mute)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
        </p>
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
  borderRadius: 20, padding: '36px 32px',
  width: '100%', maxWidth: 460, position: 'relative', zIndex: 1,
};
const logoBox = {
  width: 48, height: 48, borderRadius: 13, margin: '0 auto 14px',
  background: 'linear-gradient(135deg, #58A6FF, #D2A8FF)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
};
const labelStyle = { display: 'block', fontSize: 12, color: 'var(--snow-mute)', marginBottom: 5 };
const inputStyle = {
  width: '100%', padding: '9px 12px', fontSize: 13,
  background: 'var(--dark3)', border: '1px solid var(--border2)',
  borderRadius: 'var(--radius-md)', color: 'var(--snow)',
};
const errorBox = {
  background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.25)',
  borderRadius: 'var(--radius-md)', padding: '10px 13px',
  fontSize: 13, color: 'var(--danger)', marginBottom: 12,
};
const bgGrid = {
  position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
  backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(88,166,255,0.06) 0%, transparent 60%)',
};
