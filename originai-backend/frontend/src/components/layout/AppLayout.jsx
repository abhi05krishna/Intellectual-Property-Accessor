import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FlaskConical, LayoutDashboard, History, 
  Settings, LogOut, ChevronRight, BookOpen, Menu, X
} from 'lucide-react';
import styles from './AppLayout.module.css';

const NAV = [
  { to: '/analyze',   icon: FlaskConical,    label: 'New Analysis' },
  { to: '/history',   icon: History,         label: 'My Submissions' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/patents',   icon: BookOpen,        label: 'Recent Patents' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className={styles.root}>
      {/* ── Topbar ── */}
      <header className={styles.topbar}>
        <div className={styles.topLeft}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(o => !o)}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className={styles.logo} onClick={() => navigate('/analyze')}>
            <div className={styles.logoIcon}>🔬</div>
            <div>
              <div className={styles.logoName}>OriginAI</div>
              <div className={styles.logoSub}>research originality platform</div>
            </div>
          </div>
        </div>
        <div className={styles.topRight}>
          <div className={styles.userPill} onClick={() => navigate('/profile')}>
            <div className={styles.avatar}>{initials}</div>
            <span className={styles.userName}>{user?.name?.split(' ')[0]}</span>
            <ChevronRight size={14} style={{ color: 'var(--snow-ghost)' }} />
          </div>
        </div>
      </header>

      <div className={styles.body}>
        {/* ── Sidebar overlay (mobile) ── */}
        {sidebarOpen && (
          <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Sidebar ── */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.sidebarInner}>
            <div className={styles.navSection}>
              <div className={styles.navLabel}>Workspace</div>
              {NAV.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>

            <div className={styles.sidebarBottom}>
              <div className={styles.sep} />
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <Settings size={16} />
                <span>Settings</span>
              </NavLink>
              <button className={`${styles.navLink} ${styles.logoutBtn}`} onClick={logout}>
                <LogOut size={16} />
                <span>Log out</span>
              </button>

              {/* User card */}
              <div className={styles.userCard}>
                <div className={styles.userCardAvatar}>{initials}</div>
                <div className={styles.userCardInfo}>
                  <div className={styles.userCardName}>{user?.name}</div>
                  <div className={styles.userCardRole}>{user?.role} · {user?.institution || 'No institution'}</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
