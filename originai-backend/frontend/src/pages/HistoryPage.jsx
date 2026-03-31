// HistoryPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysisList } from '../hooks';
import { Card, PageHeader, StatCard, Badge, EmptyState, Button, Skeleton } from '../components/common';
import { ChevronRight, Trash2 } from 'lucide-react';
import { analysisAPI } from '../api/services';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const scoreColor = (s) => s >= 75 ? 'var(--success)' : s >= 50 ? 'var(--warn)' : 'var(--danger)';
const domainIcon = (d) => ({ 'Computer Science & AI': '🧠', 'Biotechnology': '🧬', 'Physics': '⚛️', 'Chemistry': '⚗️', 'Medicine & Health': '🏥' }[d] || '📄');

export default function HistoryPage() {
  const navigate = useNavigate();
  const { data, loading, refetch } = useAnalysisList();
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this analysis?')) return;
    setDeleting(id);
    try {
      await analysisAPI.deleteOne(id);
      toast.success('Analysis deleted');
      refetch();
    } catch { /* handled */ } finally { setDeleting(null); }
  };

  const analyses = data?.analyses || [];
  const completed = analyses.filter(a => a.status === 'completed');
  const avgOrig = completed.length
    ? Math.round(completed.reduce((s, a) => s + (a.scores?.originality || 0), 0) / completed.length)
    : 0;

  return (
    <div className="fade-up">
      <PageHeader title="Submission History" subtitle="All your previous analyses and their results." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Analyses" value={data?.pagination?.total || 0} />
        <StatCard label="Avg Originality" value={`${avgOrig}%`} color={scoreColor(avgOrig)} />
        <StatCard label="Completed" value={completed.length} color="var(--success)" />
        <StatCard label="Domains Explored" value={new Set(analyses.map(a => a.domain)).size} color="var(--accent4)" />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => <Skeleton key={i} height={72} />)}
        </div>
      ) : analyses.length === 0 ? (
        <EmptyState
          icon="🔍" title="No analyses yet"
          description="Submit your first abstract to get started."
          action={<Button onClick={() => navigate('/analyze')}>Run First Analysis</Button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {analyses.map(a => (
            <Card key={a._id} hover
              onClick={() => navigate(`/history/${a._id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '14px 16px' }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: 'var(--dark3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
              }}>{domainIcon(a.domain)}</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--snow)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.title || 'Untitled submission'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--snow-ghost)', fontFamily: 'var(--font-mono)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span>{a.domain}</span>
                  <span>·</span>
                  <span>{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                  <Badge color={a.status === 'completed' ? 'green' : a.status === 'failed' ? 'red' : 'amber'} size="xs">
                    {a.status}
                  </Badge>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {a.scores?.originality != null && (
                  <>
                    <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-mono)', color: scoreColor(a.scores.originality) }}>
                      {a.scores.originality}%
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--snow-ghost)' }}>originality</div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <button
                  onClick={(e) => handleDelete(e, a._id)}
                  disabled={deleting === a._id}
                  style={{ padding: 6, borderRadius: 8, color: 'var(--snow-ghost)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--snow-ghost)'}
                >
                  <Trash2 size={14} />
                </button>
                <ChevronRight size={16} style={{ color: 'var(--snow-ghost)' }} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
