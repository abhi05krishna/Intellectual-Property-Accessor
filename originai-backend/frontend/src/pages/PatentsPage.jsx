import React, { useState } from 'react';
import { usePatents } from '../hooks';
import { Card, PageHeader, Badge, EmptyState, Skeleton } from '../components/common';
import { ExternalLink } from 'lucide-react';

const DOMAINS = ['', 'Computer Science & AI', 'Biotechnology', 'Mechanical Engineering', 'Medicine & Health', 'Physics', 'Chemistry'];
const OFFICES = ['', 'USPTO', 'EPO', 'WIPO'];

const TAG_FILTERS = ['All', 'AI / ML', 'Biotech', 'Energy', 'Robotics', 'Materials', 'Semiconductors'];

export default function PatentsPage() {
  const [domain, setDomain] = useState('');
  const [office, setOffice] = useState('');
  const [activeTag, setActiveTag] = useState('All');
  const [q, setQ] = useState('');

  const { data, loading } = usePatents({ domain: domain || undefined, office: office || undefined, q: q || undefined, limit: 12 });
  const patents = data?.patents || [];

  return (
    <div className="fade-up">
      <PageHeader title="Recent Patents" subtitle="Latest patents from USPTO, EPO and WIPO — updated daily." />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search patents…"
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
        />
        <select value={domain} onChange={e => setDomain(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
          {DOMAINS.map(d => <option key={d} value={d}>{d || 'All Domains'}</option>)}
        </select>
        <select value={office} onChange={e => setOffice(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
          {OFFICES.map(o => <option key={o} value={o}>{o || 'All Offices'}</option>)}
        </select>
      </div>

      {/* Tag filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TAG_FILTERS.map(t => (
          <button
            key={t}
            onClick={() => setActiveTag(t)}
            style={{
              background: activeTag === t ? 'rgba(88,166,255,0.12)' : 'var(--dark3)',
              border: `1px solid ${activeTag === t ? 'rgba(88,166,255,0.3)' : 'var(--border)'}`,
              color: activeTag === t ? 'var(--accent)' : 'var(--snow-mute)',
              borderRadius: 99, fontSize: 12, padding: '5px 13px', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
            }}
          >{t}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} height={160} />)}
        </div>
      ) : patents.length === 0 ? (
        <EmptyState icon="🗂️" title="No patents found" description="Try adjusting the filters." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {patents.map(p => (
            <Card key={p._id} hover style={{ cursor: 'pointer', transition: 'all 0.18s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent)', marginBottom: 6 }}>{p.patentNumber}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--snow)', marginBottom: 6, lineHeight: 1.4 }}>{p.title}</div>
              <div style={{ fontSize: 11, color: 'var(--snow-ghost)', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>
                {p.assignee} · {p.office} · {p.publicationDate ? new Date(p.publicationDate).getFullYear() : 'Pending'}
              </div>
              {p.abstract && (
                <div style={{ fontSize: 12, color: 'var(--snow-mute)', lineHeight: 1.6, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {p.abstract}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(p.tags || []).slice(0, 3).map(t => <Badge key={t} color="blue">{t}</Badge>)}
                </div>
                {p.url && (
                  <a href={p.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                    style={{ color: 'var(--snow-mute)', display: 'flex', alignItems: 'center' }}>
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: '9px 12px', fontSize: 13,
  background: 'var(--dark2)', border: '1px solid var(--border2)',
  borderRadius: 'var(--radius-md)', color: 'var(--snow)',
};
