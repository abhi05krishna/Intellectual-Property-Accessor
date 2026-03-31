// AnalysisDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { analysisAPI } from '../api/services';
import { Card, ScoreRing, SectionTitle, Badge, Button, PageHeader, Skeleton } from '../components/common';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const scoreColor = (s) => s >= 75 ? 'var(--success)' : s >= 50 ? 'var(--warn)' : 'var(--danger)';
const recColors = {
  strength: 'var(--success)', improvement: 'var(--warn)',
  suggestion: 'var(--accent)', gap: 'var(--accent4)', citation_gap: 'var(--snow-ghost)',
};

export default function AnalysisDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analysisAPI.getOne(id)
      .then(({ data }) => setAnalysis(data.data.analysis))
      .catch(() => toast.error('Failed to load analysis'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleExport = async () => {
    try {
      const { data } = await analysisAPI.exportReport(id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `report-${id}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  if (loading) return (
    <div>
      <Skeleton height={28} style={{ width: 200, marginBottom: 20 }} />
      <Skeleton height={200} style={{ marginBottom: 16 }} />
      <Skeleton height={120} />
    </div>
  );
  if (!analysis) return <div style={{ color: 'var(--danger)' }}>Analysis not found.</div>;

  return (
    <div className="fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate('/history')}>Back</Button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--snow)' }}>{analysis.title || 'Untitled'}</div>
            <div style={{ fontSize: 12, color: 'var(--snow-mute)' }}>{analysis.domain} · {new Date(analysis.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" icon={<Download size={14} />} onClick={handleExport}>Export</Button>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24, padding: '8px 0' }}>
          <ScoreRing score={analysis.scores?.originality || 0} label="Originality" size={110} />
          <ScoreRing score={100 - (analysis.scores?.similarity || 0)} label="Uniqueness" size={110} />
          <ScoreRing score={analysis.scores?.noveltyPotential || 0} label="Novelty" size={110} color="var(--accent4)" />
        </div>
        {analysis.aiSummary && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--dark3)', borderRadius: 10, fontSize: 13, color: 'var(--snow-mute)', lineHeight: 1.7, borderLeft: '3px solid var(--accent)' }}>
            {analysis.aiSummary}
          </div>
        )}
      </Card>

      <SectionTitle>Abstract</SectionTitle>
      <Card style={{ marginBottom: 20, fontSize: 13, color: 'var(--snow-mute)', lineHeight: 1.8 }}>
        {analysis.abstract}
      </Card>

      <SectionTitle>Similar Works ({analysis.similarWorks?.length || 0})</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {(analysis.similarWorks || []).map((w, i) => (
          <Card key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 16px' }}>
            <div style={{ minWidth: 34, height: 34, background: 'var(--dark3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--snow-mute)' }}>#{i+1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--snow)', marginBottom: 3 }}>{w.title}</div>
              <div style={{ fontSize: 11, color: 'var(--snow-ghost)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>{w.source?.toUpperCase()} · {w.year}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(w.tags || []).slice(0, 4).map(t => <Badge key={t}>{t}</Badge>)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-mono)', color: scoreColor(100 - w.similarityPercent) }}>{w.similarityPercent}%</div>
              <div style={{ fontSize: 10, color: 'var(--snow-ghost)' }}>similarity</div>
              {w.url && <a href={w.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', marginTop: 4 }}>View <ExternalLink size={10} /></a>}
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle>Recommendations</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {(analysis.recommendations || []).map((r, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${recColors[r.type] || 'var(--border2)'}`, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: recColors[r.type], marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{r.type?.replace('_', ' ')}</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--snow)', marginBottom: 5 }}>{r.title}</div>
            <div style={{ fontSize: 12, color: 'var(--snow-mute)', lineHeight: 1.6 }}>{r.description}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
