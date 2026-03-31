import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, authAPI } from '../api/services';
import { Card, PageHeader, Button, SectionTitle } from '../components/common';
import { Save, Lock, Trash2, User } from 'lucide-react';
import toast from 'react-hot-toast';

const DOMAINS = [
  'Computer Science & AI', 'Biotechnology', 'Mechanical Engineering',
  'Medicine & Health', 'Physics', 'Chemistry', 'Social Sciences', 'Other',
];

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();

  const [profile, setProfile] = useState({
    name: user?.name || '',
    institution: user?.institution || '',
    domain: user?.domain || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await usersAPI.updateProfile(profile);
      updateUser(data.data.user);
      toast.success('Profile updated!');
    } catch { /* handled by interceptor */ }
    finally { setSavingProfile(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSavingPw(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password changed!');
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
    } catch { /* handled */ }
    finally { setSavingPw(false); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    if (!window.confirm('Final confirmation: all your analyses will be lost.')) return;
    try {
      await usersAPI.deleteAccount();
      toast.success('Account deleted');
      logout();
    } catch { /* handled */ }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="fade-up" style={{ maxWidth: 680 }}>
      <PageHeader title="Profile & Settings" subtitle="Manage your account, preferences and security." />

      {/* Avatar + info */}
      <Card style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, padding: '20px 24px' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent2), var(--accent))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 600, color: '#fff', flexShrink: 0,
        }}>{initials}</div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--snow)' }}>{user?.name}</div>
          <div style={{ fontSize: 13, color: 'var(--snow-mute)', marginBottom: 6 }}>{user?.email}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={pillStyle}>{user?.role}</span>
            {user?.institution && <span style={pillStyle}>{user.institution}</span>}
            <span style={{ ...pillStyle, color: 'var(--success)', background: 'rgba(63,182,139,0.12)' }}>
              {user?.totalAnalyses || 0} analyses
            </span>
          </div>
        </div>
      </Card>

      {/* Profile form */}
      <SectionTitle>Personal Information</SectionTitle>
      <Card style={{ marginBottom: 24 }}>
        <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Full name</label>
              <input
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Institution</label>
              <input
                value={profile.institution}
                onChange={e => setProfile(p => ({ ...p, institution: e.target.value }))}
                placeholder="MIT, IIT Delhi, etc."
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Primary research domain</label>
            <select
              value={profile.domain}
              onChange={e => setProfile(p => ({ ...p, domain: e.target.value }))}
              style={inputStyle}
            >
              <option value="">Select domain…</option>
              {DOMAINS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input value={user?.email || ''} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
            <div style={{ fontSize: 11, color: 'var(--snow-ghost)', marginTop: 4 }}>Email cannot be changed after registration.</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" loading={savingProfile} icon={<Save size={14} />}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Password form */}
      <SectionTitle>Change Password</SectionTitle>
      <Card style={{ marginBottom: 24 }}>
        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Current password</label>
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
              placeholder="••••••••"
              style={inputStyle}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>New password</label>
              <input
                type="password"
                value={passwords.newPassword}
                onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                placeholder="Min. 8 characters"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Confirm new password</label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                placeholder="••••••••"
                style={inputStyle}
                required
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" loading={savingPw} variant="secondary" icon={<Lock size={14} />}>
              Update password
            </Button>
          </div>
        </form>
      </Card>

      {/* Stats summary */}
      <SectionTitle>Account Statistics</SectionTitle>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { label: 'Total Analyses', value: user?.totalAnalyses || 0, color: 'var(--snow)' },
            { label: 'Avg Originality', value: user?.averageOriginalityScore ? `${Math.round(user.averageOriginalityScore)}%` : '—', color: 'var(--success)' },
            { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—', color: 'var(--accent)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '12px 8px' }}>
              <div style={{ fontSize: 26, fontWeight: 600, fontFamily: 'var(--font-mono)', color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--snow-ghost)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Danger zone */}
      <SectionTitle>Danger Zone</SectionTitle>
      <Card style={{ border: '1px solid rgba(248,81,73,0.2)', padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--snow)', marginBottom: 4 }}>Delete account</div>
            <div style={{ fontSize: 12, color: 'var(--snow-mute)' }}>
              Permanently delete your account and all associated analyses. This cannot be undone.
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 size={14} />}
            onClick={handleDeleteAccount}
            style={{ flexShrink: 0, marginLeft: 16 }}
          >
            Delete account
          </Button>
        </div>
      </Card>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, color: 'var(--snow-mute)', marginBottom: 5 };
const inputStyle = {
  width: '100%', padding: '9px 12px', fontSize: 13,
  background: 'var(--dark3)', border: '1px solid var(--border2)',
  borderRadius: 'var(--radius-md)', color: 'var(--snow)',
};
const pillStyle = {
  fontSize: 11, fontFamily: 'var(--font-mono)',
  background: 'var(--dark3)', color: 'var(--snow-mute)',
  padding: '2px 8px', borderRadius: 99,
};
