import React from 'react';

/* ── Button ── */
export const Button = ({
  children, variant = 'primary', size = 'md',
  loading = false, icon, className = '', ...props
}) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    fontFamily: 'var(--font-sans)', fontWeight: 500, cursor: 'pointer',
    borderRadius: 'var(--radius-md)', border: 'none',
    transition: 'all 0.18s ease', whiteSpace: 'nowrap',
  };
  const sizes = {
    sm: { padding: '7px 13px', fontSize: 12 },
    md: { padding: '10px 18px', fontSize: 13 },
    lg: { padding: '13px 24px', fontSize: 14 },
  };
  const variants = {
    primary:   { background: 'linear-gradient(135deg, #58A6FF, #D2A8FF)', color: '#fff' },
    secondary: { background: 'var(--dark3)', color: 'var(--snow)', border: '1px solid var(--border2)' },
    ghost:     { background: 'transparent', color: 'var(--snow-mute)', border: '1px solid var(--border2)' },
    danger:    { background: 'rgba(248,81,73,0.12)', color: 'var(--danger)', border: '1px solid rgba(248,81,73,0.25)' },
    success:   { background: 'rgba(63,182,139,0.12)', color: 'var(--success)', border: '1px solid rgba(63,182,139,0.25)' },
  };

  return (
    <button
      style={{ ...base, ...sizes[size], ...variants[variant], opacity: props.disabled ? 0.5 : 1 }}
      className={className}
      {...props}
    >
      {loading
        ? <span style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
        : icon}
      {children}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
};

/* ── Card ── */
export const Card = ({ children, className = '', style = {}, hover = false, ...props }) => (
  <div
    style={{
      background: 'var(--dark2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '18px 20px',
      transition: hover ? 'border-color 0.18s ease, transform 0.18s ease' : undefined,
      ...style,
    }}
    className={className}
    {...props}
  >
    {children}
  </div>
);

/* ── Badge ── */
export const Badge = ({ children, color = 'default', size = 'sm' }) => {
  const colors = {
    default: { bg: 'var(--dark4)', color: 'var(--snow-mute)' },
    blue:    { bg: 'rgba(88,166,255,0.15)', color: '#58A6FF' },
    green:   { bg: 'rgba(63,182,139,0.15)', color: '#3FB68B' },
    amber:   { bg: 'rgba(210,153,34,0.15)', color: '#D29922' },
    red:     { bg: 'rgba(248,81,73,0.15)', color: '#F85149' },
    purple:  { bg: 'rgba(210,168,255,0.15)', color: '#D2A8FF' },
  };
  const c = colors[color] || colors.default;
  return (
    <span style={{
      background: c.bg, color: c.color,
      fontSize: size === 'xs' ? 10 : 11,
      padding: size === 'xs' ? '2px 6px' : '3px 8px',
      borderRadius: 99, fontFamily: 'var(--font-mono)',
      whiteSpace: 'nowrap', fontWeight: 500,
    }}>
      {children}
    </span>
  );
};

/* ── ScoreRing ── */
export const ScoreRing = ({ score, size = 100, label, color }) => {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const auto = score >= 75 ? '#3FB68B' : score >= 50 ? '#D29922' : '#F85149';
  const c = color || auto;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--dark3)" strokeWidth={6} />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={c} strokeWidth={6}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease' }}
        />
        <text
          x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
          style={{ transform: 'rotate(90deg)', transformOrigin: '50% 50%', fontFamily: 'var(--font-mono)', fill: c, fontSize: size * 0.22, fontWeight: 500 }}
        >
          {score}%
        </text>
      </svg>
      {label && <span style={{ fontSize: 11, color: 'var(--snow-ghost)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>}
    </div>
  );
};

/* ── ProgressPipeline ── */
export const ProgressPipeline = ({ progress, step }) => {
  const steps = [
    'Parsing document',
    'Vectorizing text',
    'Semantic search',
    'Comparing papers',
    'AI recommendations',
  ];
  const activeStep = Math.floor((progress / 100) * steps.length);

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--snow-mute)' }}>{step}</span>
        <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{progress}%</span>
      </div>
      <div style={{ background: 'var(--dark3)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: 'linear-gradient(90deg, #58A6FF, #D2A8FF)',
          width: `${progress}%`, transition: 'width 0.5s ease',
        }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {steps.map((s, i) => (
          <span key={s} style={{
            fontSize: 11, fontFamily: 'var(--font-mono)',
            color: i < activeStep ? 'var(--success)' : i === activeStep ? 'var(--accent)' : 'var(--snow-ghost)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {i < activeStep ? '✓' : i === activeStep ? '●' : '○'} {s}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ── Skeleton ── */
export const Skeleton = ({ width = '100%', height = 16, style = {} }) => (
  <div className="skeleton" style={{ width, height, borderRadius: 'var(--radius-sm)', ...style }} />
);

/* ── SectionTitle ── */
export const SectionTitle = ({ children }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
  }}>
    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--snow)', whiteSpace: 'nowrap' }}>{children}</span>
    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
  </div>
);

/* ── StatCard ── */
export const StatCard = ({ label, value, color, sub }) => (
  <Card style={{ padding: '16px 18px' }}>
    <div style={{ fontSize: 11, color: 'var(--snow-ghost)', fontFamily: 'var(--font-mono)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 600, fontFamily: 'var(--font-mono)', color: color || 'var(--snow)' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: 'var(--snow-ghost)', marginTop: 4 }}>{sub}</div>}
  </Card>
);

/* ── Empty state ── */
export const EmptyState = ({ icon, title, description, action }) => (
  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--snow)', marginBottom: 6 }}>{title}</div>
    <div style={{ fontSize: 13, color: 'var(--snow-mute)', marginBottom: action ? 20 : 0 }}>{description}</div>
    {action}
  </div>
);

/* ── Page header ── */
export const PageHeader = ({ title, subtitle }) => (
  <div style={{ marginBottom: 24 }}>
    <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--snow)', marginBottom: 4 }}>{title}</h1>
    {subtitle && <p style={{ fontSize: 13, color: 'var(--snow-mute)' }}>{subtitle}</p>}
  </div>
);
