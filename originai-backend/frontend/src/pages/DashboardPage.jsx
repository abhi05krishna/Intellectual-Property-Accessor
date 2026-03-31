import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../hooks';
import { Card, PageHeader, StatCard, SectionTitle, Button, Skeleton } from '../components/common';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatDistanceToNow } from 'date-fns';

const scoreColor = (s) => s >= 75 ? 'var(--success)' : s >= 50 ? 'var(--warn)' : 'var(--danger)';
const domainIcon = (d) => ({ 'Computer Science & AI': '🧠', 'Biotechnology': '🧬', 'Physics': '⚛️', 'Chemistry': '⚗️', 'Medicine & Health': '🏥' }[d] || '📄');

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--dark2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
      <div style={{ color: 'var(--snow-mute)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--accent)' }}>Originality: {payload[0]?.value}%</div>
    </div>
  );
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, loading } = useDashboard();

  if (loading) return (
    <div>
      <Skeleton height={28} style={{ width: 200, marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[1,2,3,4].map(i => <Skeleton key={i} height={90} />)}
      </div>
      <Skeleton height={240} />
    </div>
  );

  const { stats, recentAnalyses, domainBreakdown, trendData, recentPatents } = data || {};

  return (
    <div className="fade-up">
      <PageHeader title="Dashboard" subtitle="Your research activity overview." />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
        <StatCard label="Total Analyses" value={stats?.totalAnalyses || 0} />
        <StatCard label="Avg Originality" value={`${stats?.avgOriginality || 0}%`} color={scoreColor(stats?.avgOriginality)} />
        <StatCard label="High Novelty" value={stats?.highNoveltyCount || 0} color="var(--accent4)" sub="≥ 80% novelty score" />
        <StatCard label="Fields Explored" value={stats?.fieldsExplored || 0} color="var(--accent)" />
        <StatCard label="Patent Conflicts" value={stats?.patentConflicts || 0} color={stats?.patentConflicts > 0 ? 'var(--warn)' : 'var(--success)'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, marginBottom: 24 }}>
        {/* Trend chart */}
        <div>
          <SectionTitle>Originality Trend</SectionTitle>
          <Card style={{ padding: '20px 16px' }}>
            {trendData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,246,252,0.06)" />
                  <XAxis dataKey="label" tick={{ fill: '#6E7681', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[40, 100]} tick={{ fill: '#6E7681', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="avgOriginality" stroke="#58A6FF" strokeWidth={2} dot={{ fill: '#58A6FF', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--snow-ghost)', fontSize: 13 }}>
                Run more analyses to see your trend
              </div>
            )}
          </Card>
        </div>

        {/* Domain breakdown */}
        <div>
          <SectionTitle>By Domain</SectionTitle>
          <Card style={{ padding: '14px 16px' }}>
            {domainBreakdown?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {domainBreakdown.map(d => (
                  <div key={d._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--snow-mute)' }}>{domainIcon(d._id)} {d._id}</span>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--snow-ghost)' }}>{d.count}</span>
                    </div>
                    <div style={{ background: 'var(--dark3)', borderRadius: 99, height: 4 }}>
                      <div style={{ height: '100%', borderRadius: 99, background: 'var(--accent)', width: `${Math.round((d.count / stats?.totalAnalyses) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--snow-ghost)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No data yet</div>
            )}
          </Card>
        </div>
      </div>

      {/* Recent analyses */}
      <SectionTitle>Recent Submissions</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {recentAnalyses?.map(a => (
          <Card key={a._id} hover
            onClick={() => navigate(`/history/${a._id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '12px 16px' }}
          >
            <div style={{ width: 36, height: 36, background: 'var(--dark3)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{domainIcon(a.domain)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--snow)' }}>{a.title || 'Untitled'}</div>
              <div style={{ fontSize: 11, color: 'var(--snow-ghost)', fontFamily: 'var(--font-mono)' }}>{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</div>
            </div>
            {a.scores?.originality != null && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-mono)', color: scoreColor(a.scores.originality) }}>{a.scores.originality}%</div>
              </div>
            )}
          </Card>
        ))}
        {!recentAnalyses?.length && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--snow-ghost)', fontSize: 13 }}>No analyses yet. <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate('/analyze')}>Run your first →</span></div>
        )}
      </div>

      {/* Recent patents */}
      {recentPatents?.length > 0 && (
        <>
          <SectionTitle>Recent Patents</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {recentPatents.slice(0, 4).map(p => (
              <Card key={p._id} hover style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent)', marginBottom: 4 }}>{p.patentNumber}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--snow)', marginBottom: 4, lineHeight: 1.4 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: 'var(--snow-ghost)' }}>{p.assignee}</div>
              </Card>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Button variant="ghost" size="sm" onClick={() => navigate('/patents')}>View all patents →</Button>
          </div>
        </>
      )}
    </div>
  );
}
