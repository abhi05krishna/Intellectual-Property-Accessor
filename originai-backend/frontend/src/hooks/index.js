import { useState, useEffect, useCallback, useRef } from 'react';
import { analysisAPI, dashboardAPI, patentsAPI } from '../api/services';
import toast from 'react-hot-toast';

// ── useAnalysisList ──────────────────────────────────────────
export const useAnalysisList = (params = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await analysisAPI.getAll(params);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analyses');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
};

// ── useAnalysisPoller ────────────────────────────────────────
// Submits an analysis and polls until completed/failed

const STEPS = [
  { pct: 15, label: 'Parsing document...' },
  { pct: 32, label: 'Vectorizing with sentence-BERT...' },
  { pct: 55, label: 'Searching vector database...' },
  { pct: 78, label: 'Comparing 4.2M papers...' },
  { pct: 92, label: 'Generating AI recommendations...' },
  { pct: 100, label: 'Finalizing report...' },
];
export const useAnalysisPoller = () => {
  const [analysisId, setAnalysisId] = useState(null);
  const [status, setStatus] = useState(null);  // pending | processing | completed | failed
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const intervalRef = useRef(null);

  

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback((id) => {
    let stepIdx = 0;
    intervalRef.current = setInterval(async () => {
      try {
        const { data } = await analysisAPI.getStatus(id);
        const s = data.data;

        // Advance fake progress bar
        if (stepIdx < STEPS.length) {
          const cur = STEPS[stepIdx];
          setProgress(cur.pct);
          setStep(cur.label);
          stepIdx++;
        }

        setStatus(s.status);

        if (s.status === 'completed') {
          stopPolling();
          setProgress(100);
          setStep('Complete!');
          const { data: full } = await analysisAPI.getOne(id);
          setResult(full.data.analysis);
          toast.success('Analysis complete!');
        } else if (s.status === 'failed') {
          stopPolling();
          toast.error(s.errorMessage || 'Analysis failed');
        }
      } catch (err) {
        stopPolling();
        toast.error('Lost connection while polling');
      }
    }, 2200);
  }, [stopPolling]);

  const submit = useCallback(async (formData, isFile = false) => {
    setSubmitting(true);
    setResult(null);
    setStatus('pending');
    setProgress(5);
    setStep('Submitting...');

    try {
      let res;
      if (isFile) {
        res = await analysisAPI.submit(formData);
      } else {
        res = await analysisAPI.submitText(formData);
      }
      const id = res.data.data.analysisId;
      setAnalysisId(id);
      setStatus('processing');
      startPolling(id);
    } catch (err) {
      setStatus(null);
      setProgress(0);
      setStep('');
    } finally {
      setSubmitting(false);
    }
  }, [startPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setAnalysisId(null);
    setStatus(null);
    setResult(null);
    setProgress(0);
    setStep('');
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  return { submit, reset, analysisId, status, result, progress, step, submitting };
};

// ── useDashboard ─────────────────────────────────────────────
export const useDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get()
      .then(({ data: res }) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
};

// ── usePatents ───────────────────────────────────────────────
export const usePatents = (params = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await patentsAPI.getAll(params);
      setData(res.data);
    } catch { /* handled by interceptor */ }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
};
