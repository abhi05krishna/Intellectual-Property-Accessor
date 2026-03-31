import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { useAnalysisPoller } from '../hooks';
import {
  Button, Card, ScoreRing, ProgressPipeline,
  SectionTitle, Badge, PageHeader
} from '../components/common';
import { Search, UploadCloud, X, Download, RotateCcw, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { analysisAPI } from '../api/services';

const DOMAINS = [
  'Computer Science & AI', 'Biotechnology', 'Mechanical Engineering',
  'Medicine & Health', 'Physics', 'Chemistry', 'Social Sciences', 'Other',
];
const DOC_TYPES = ['abstract', 'paper', 'thesis', 'patent_application', 'technical_report'];
const DATABASES = [
  { value: 'all', label: 'All Sources' },
  { value: 'academic', label: 'Academic Papers Only' },
  { value: 'patents', label: 'Patents Only' },
  { value: 'arxiv_ieee_acm', label: 'ArXiv + IEEE + ACM' },
];

const DEMO = `This paper presents a novel federated learning framework incorporating differential privacy mechanisms to address data confidentiality in distributed healthcare systems. We propose an adaptive Gaussian noise injection strategy that dynamically calibrates privacy budgets based on gradient sensitivity analysis. Our approach achieves a privacy-utility tradeoff that outperforms existing baselines by 23% on benchmark medical imaging datasets while maintaining HIPAA compliance constraints. The system architecture leverages secure aggregation protocols and a custom communication compression scheme reducing bandwidth usage by 41%.`;

export default function AnalyzePage() {
  const navigate = useNavigate();
  const { submit, reset, status, result, progress, step, submitting } = useAnalysisPoller();
  const [abstract, setAbstract] = useState('');
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('Computer Science & AI');
  const [docType, setDocType] = useState('abstract');
  const [database, setDatabase] = useState('all');
  const [file, setFile] = useState(null);

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: false,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'text/markdown': ['.md'] },
    maxSize: 10 * 1024 * 1024,
    onDropRejected: () => toast.error('File too large or unsupported format'),
  });

  const handleSubmit = async () => {
    if (!abstract.trim() && !file) {
      toast.error('Please paste an abstract or upload a file');
      return;
    }
    if (file) {
      const fd = new FormData();
      fd.append('document', file);
      fd.append('title', title);
      fd.append('domain', domain);
      fd.append('documentType', docType);
      fd.append('comparisonDatabase', database);
      await submit(fd, true);
    } else {
      await submit({ abstract, title, domain, documentType: docType, comparisonDatabase: database });
    }
  };

  const handleExport = async () => {
    if (!result) return;
    try {
      const { data } = await analysisAPI.exportReport(result._id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `originai-report-${result._id}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  const handleReset = () => {
    reset(); setAbstract(''); setTitle(''); setFile(null);
  };

  const isProcessing = status === 'processing' || status === 'pending';

  return (
    <div className="fade-up">
      <PageHeader
        title="Check Your Research"
        subtitle="Upload your abstract or paper to check originality, find similar works, and get AI-powered improvement recommendations."
      />

      {!result && (
        <>
          {/* Upload zone */}
          {!file && (
            <div
              {...getRootProps()}
              style={{
                border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border2)'}`,
                borderRadius: 'var(--radius-xl)', padding: '36px 24px', textAlign: 'center',
                cursor: 'pointer', transition: 'all 0.18s', marginBottom: 16,
                background: isDragActive ? 'var(--accent-dim)' : 'var(--dark2)',
              }}
            >
              <input {...getInputProps()} />
              <UploadCloud size={32} style={{ color: 'var(--snow-mute)', marginBottom: 10 }} />
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--snow)', marginBottom: 6 }}>
                {isDragActive ? 'Drop it here' : 'Drop your paper here or click to upload'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--snow-mute)', marginBottom: 12 }}>
                Supports PDF, TXT, MD — up to 10MB
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {['.PDF', '.TXT', '.MD'].map(f => (
                  <span key={f} style={{
                    background: 'var(--dark3)', border: '1px solid var(--border2)',
                    color: 'var(--snow-mute)', fontSize: 10, fontFamily: 'var(--font-mono)',
                    padding: '3px 8px', borderRadius: 6,
                  }}>{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* File pill */}
          {file && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(63,182,139,0.1)', border: '1px solid rgba(63,182,139,0.25)',
              borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16,
            }}>
              <span style={{ fontSize: 20 }}>📄</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--snow)' }}>{file.name}</div>
                <div style={{ fontSize: 11, color: 'var(--snow-ghost)', fontFamily: 'var(--font-mono)' }}>
                  {(file.size / 1024).toFixed(0)} KB
                </div>
              </div>
              <button onClick={() => setFile(null)} style={{ color: 'var(--snow-mute)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* Divider */}
          {!file && (
            <div style={{ textAlign: 'center', color: 'var(--snow-ghost)', fontSize: 12, margin: '0 0 14px', letterSpacing: 1 }}>— or paste below —</div>
          )}

          {/* Abstract textarea */}
          {!file && (
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <textarea
                value={abstract}
                onChange={e => setAbstract(e.target.value)}
                placeholder="Paste your abstract or research summary here…"
                style={{
                  width: '100%', minHeight: 160, padding: '14px 14px 36px',
                  background: 'var(--dark2)', border: '1px solid var(--border2)',
                  borderRadius: 'var(--radius-lg)', color: 'var(--snow)', fontSize: 14,
                  resize: 'vertical', lineHeight: 1.7,
                }}
              />
              <div style={{ position: 'absolute', bottom: 10, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--snow-ghost)', fontFamily: 'var(--font-mono)' }}>{abstract.length} / 5000</span>
                <button onClick={() => setAbstract(DEMO)} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Load demo
                </button>
              </div>
            </div>
          )}

          {/* Fields row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Title (optional)</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Paper title…" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Domain</label>
              <select value={domain} onChange={e => setDomain(e.target.value)} style={inputStyle}>
                {DOMAINS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Document type</label>
              <select value={docType} onChange={e => setDocType(e.target.value)} style={inputStyle}>
                {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Compare against</label>
              <select value={database} onChange={e => setDatabase(e.target.value)} style={inputStyle}>
                {DATABASES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Button
              icon={<Search size={15} />}
              onClick={handleSubmit}
              loading={submitting}
              disabled={isProcessing}
              size="lg"
            >
              Analyze Originality
            </Button>
          </div>
        </>
      )}

      {/* Progress */}
      {isProcessing && (
        <Card style={{ marginTop: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--snow)', marginBottom: 4 }}>Analyzing your research…</div>
          <div style={{ fontSize: 12, color: 'var(--snow-mute)' }}>This typically takes 10–20 seconds</div>
          <ProgressPipeline progress={progress} step={step} />
        </Card>
      )}

      {/* Results */}
      {result && <AnalysisResults result={result} onReset={handleReset} onExport={handleExport} onHistory={() => navigate('/history')} />}
    </div>
  );
}

function AnalysisResults({ result, onReset, onExport, onHistory }) {
  const { scores, similarWorks, recommendations, aiSummary, title, domain } = result;

  const recColors = {
    strength: 'var(--success)', improvement: 'var(--warn)',
    suggestion: 'var(--accent)', gap: 'var(--accent4)', citation_gap: 'var(--snow-ghost)',
  };

  return (
    <div className="fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--snow)' }}>Analysis Results</div>
          <div style={{ fontSize: 12, color: 'var(--snow-mute)' }}>{title || 'Untitled'} · {domain}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" size="sm" icon={<Download size={14} />} onClick={onExport}>Export</Button>
          <Button variant="ghost" size="sm" icon={<RotateCcw size={14} />} onClick={onReset}>New Analysis</Button>
        </div>
      </div>

      {/* Score rings */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0', flexWrap: 'wrap', gap: 24 }}>
          <ScoreRing score={scores?.originality || 0} label="Originality" size={110} />
          <ScoreRing score={100 - (scores?.similarity || 0)} label="Uniqueness" size={110} />
          <ScoreRing score={scores?.noveltyPotential || 0} label="Novelty Potential" size={110} color="var(--accent4)" />
        </div>
        {aiSummary && (
          <div style={{
            marginTop: 16, padding: '12px 16px', background: 'var(--dark3)',
            borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--snow-mute)', lineHeight: 1.7,
            borderLeft: '3px solid var(--accent)',
          }}>
            {aiSummary}
          </div>
        )}
      </Card>

      {/* Similar works */}
      <SectionTitle>Similar Works Found ({similarWorks?.length || 0})</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {(similarWorks || []).slice(0, 5).map((w, i) => (
          <Card key={i} hover style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 16px' }}>
            <div style={{
              minWidth: 36, height: 36, background: 'var(--dark3)', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--snow-mute)',
            }}>#{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--snow)', marginBottom: 4, lineHeight: 1.4 }}>{w.title}</div>
              <div style={{ fontSize: 11, color: 'var(--snow-ghost)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                {w.source?.toUpperCase()} · {w.year || 'N/A'} · {w.externalId}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(w.tags || []).slice(0, 4).map(t => <Badge key={t} color="default">{t}</Badge>)}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{
                fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-mono)',
                color: w.similarityPercent > 40 ? 'var(--danger)' : w.similarityPercent > 20 ? 'var(--warn)' : 'var(--success)',
              }}>{w.similarityPercent}%</div>
              <div style={{ fontSize: 10, color: 'var(--snow-ghost)' }}>similarity</div>
              {w.url && (
                <a href={w.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', marginTop: 4 }}>
                  View <ExternalLink size={10} />
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Recommendations */}
      <SectionTitle>Recommendations</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginBottom: 24 }}>
        {(recommendations || []).map((r, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${recColors[r.type] || 'var(--border2)'}`, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: recColors[r.type], marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {r.type?.replace('_', ' ')} · {r.priority}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--snow)', marginBottom: 6 }}>{r.title}</div>
            <div style={{ fontSize: 12, color: 'var(--snow-mute)', lineHeight: 1.6 }}>{r.description}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="ghost" size="sm" icon={<RotateCcw size={14} />} onClick={onReset}>Run Another</Button>
        <Button variant="secondary" size="sm" onClick={onHistory}>View All History</Button>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, color: 'var(--snow-mute)', marginBottom: 5 };
const inputStyle = {
  width: '100%', padding: '9px 12px', fontSize: 13,
  background: 'var(--dark3)', border: '1px solid var(--border2)',
  borderRadius: 'var(--radius-md)', color: 'var(--snow)',
};
