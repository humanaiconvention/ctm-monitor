import React, { useEffect, useRef, useState, useCallback } from 'react';
import { trackEvent } from '../analytics';
import { PREVIEW_QUESTIONS_CONFIG } from '../config/previewQuestions';

interface FormState {
  name: string;
  email: string;
  question: string;
}

// Lightweight client-side validation (no backend yet)
const initialState: FormState = { name: '', email: '', question: '' };

/**
 * PreviewQuestions
 * Restored page that allows visitors to submit (non-persisted) questions during early preview cycles.
 * Currently logs to console + fires analytics event. Future: wire into backend or email bridge.
 */
const LS_DRAFT_KEY = 'preview:question:draft:v1';
const LS_HISTORY_KEY = 'preview:question:history:v1'; // JSON array of ISO timestamps
const LS_LAST_SUBMISSION_KEY = 'preview:question:last:v1'; // Stores last submitted full payload for UX reassurance
const { RATE_LIMIT_WINDOW_MS: SUBMISSION_WINDOW_MS, MAX_PER_HOUR: SUBMISSION_MAX_PER_WINDOW, DUPLICATE_WINDOW_MS: DUPLICATE_HASH_WINDOW, DRAFT_DEBOUNCE_MS, SUCCESS_AUTO_HIDE_MS } = PREVIEW_QUESTIONS_CONFIG;

function hashString(str: string): string {
  let h = 0, i = 0; const len = str.length;
  while (i < len) { h = ((h << 5) - h + str.charCodeAt(i++)) | 0; }
  return Math.abs(h).toString(36);
}

interface StoredSubmissionMeta { t: string; h: string }

const PreviewQuestions: React.FC = () => {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateInfo, setRateInfo] = useState<{ remaining: number; resetAt: number | null } | null>(null);
  const [lastSubmission, setLastSubmission] = useState<null | { question: string; ts: string; snippet: string }>(null);
  const successTimeoutRef = useRef<number | null>(null);

  // (Initial load handled by effect below that depends on refreshRateInfo)

  // Persist draft (throttle-lite via effect on change)
  useEffect(() => {
    const handle = setTimeout(() => {
      try { localStorage.setItem(LS_DRAFT_KEY, JSON.stringify({ name: form.name, email: form.email, question: form.question })); } catch { /* ignore */ }
    }, DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [form.name, form.email, form.question]);

  function loadHistory(): StoredSubmissionMeta[] {
    try { return JSON.parse(localStorage.getItem(LS_HISTORY_KEY) || '[]') as StoredSubmissionMeta[]; } catch { return []; }
  }
  function saveHistory(items: StoredSubmissionMeta[]) {
    try { localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }
  function pruneHistory(items: StoredSubmissionMeta[]): StoredSubmissionMeta[] {
    const cutoff = Date.now() - Math.max(SUBMISSION_WINDOW_MS, DUPLICATE_HASH_WINDOW);
    return items.filter(i => new Date(i.t).getTime() >= cutoff);
  }
  const refreshRateInfo = useCallback(() => {
    const now = Date.now();
    const items = pruneHistory(loadHistory());
    const windowStart = now - SUBMISSION_WINDOW_MS;
    const inWindow = items.filter(i => new Date(i.t).getTime() >= windowStart);
    const remaining = Math.max(0, SUBMISSION_MAX_PER_WINDOW - inWindow.length);
    // Compute next resetAt (next hour-window boundary) = earliest event + window
    let resetAt: number | null = null;
    if (inWindow.length > 0) {
      const earliest = Math.min(...inWindow.map(i => new Date(i.t).getTime()));
      resetAt = earliest + SUBMISSION_WINDOW_MS;
    }
    setRateInfo({ remaining, resetAt });
    }, []);

    // Load draft on mount (moved below refreshRateInfo so it exists)
    useEffect(() => {
      try {
        const raw = localStorage.getItem(LS_DRAFT_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<FormState>;
          setForm(f => ({ ...f, ...parsed }));
        }
        const last = localStorage.getItem(LS_LAST_SUBMISSION_KEY);
        if (last) {
          const parsedLast = JSON.parse(last) as { question: string; ts: string; snippet?: string };
          setLastSubmission({ question: parsedLast.question, ts: parsedLast.ts, snippet: parsedLast.snippet || parsedLast.question.slice(0,80) });
        }
      } catch { /* ignore */ }
      refreshRateInfo();
      return () => { if (successTimeoutRef.current) window.clearTimeout(successTimeoutRef.current); };
    }, [refreshRateInfo]);


  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.question.trim()) {
      setError('Please enter a question.');
      return;
    }
    // Rate limiting & duplicate detection
    const history = pruneHistory(loadHistory());
    const now = Date.now();
    const windowStart = now - SUBMISSION_WINDOW_MS;
    const inWindow = history.filter(i => new Date(i.t).getTime() >= windowStart);
    if (inWindow.length >= SUBMISSION_MAX_PER_WINDOW) {
      const blockedMeta = { remaining: 0 };
      trackEvent({ category: 'interaction', action: 'question_submit', label: 'rate_limited', metadata: { ...blockedMeta } });
      setError('Rate limit: please wait before submitting more questions.');
      refreshRateInfo();
      return;
    }
    const h = hashString(form.question.trim().toLowerCase());
    const duplicateCutoff = now - DUPLICATE_HASH_WINDOW;
    const recentDupe = history.find(i => i.h === h && new Date(i.t).getTime() >= duplicateCutoff);
    if (recentDupe) {
      trackEvent({ category: 'interaction', action: 'question_submit', label: 'duplicate_block', metadata: { ageMs: now - new Date(recentDupe.t).getTime() } });
      setError('Looks like you already asked that recently.');
      return;
    }
    try {
      // For now just log locally; no network IO to avoid implying persistence.
      // eslint-disable-next-line no-console
      console.log('[preview:question]', { ...form, ts: new Date().toISOString() });
      const questionText = form.question.trim();
      const words = questionText.split(/\s+/).filter(Boolean);
      const meta = { snippet: questionText.slice(0,80), length: questionText.length, words: words.length, hasName: !!form.name, hasEmail: !!form.email, priorInWindow: inWindow.length };
      trackEvent({ category: 'interaction', action: 'question_submit', label: 'submit', metadata: meta });
      // Update history
      const updated = [...history, { t: new Date().toISOString(), h }];
      saveHistory(updated);
      // Persist last submission for UX reassurance
      try {
        const ts = new Date().toISOString();
        localStorage.setItem(LS_LAST_SUBMISSION_KEY, JSON.stringify({ question: questionText, ts, snippet: meta.snippet }));
        setLastSubmission({ question: questionText, ts, snippet: meta.snippet });
      } catch { /* ignore */ }
      refreshRateInfo();
      setSubmitted(true);
      setForm(initialState);
      try { localStorage.removeItem(LS_DRAFT_KEY); } catch { /* ignore */ }
      // Auto-hide success after a delay
      if (successTimeoutRef.current) window.clearTimeout(successTimeoutRef.current);
  successTimeoutRef.current = window.setTimeout(() => setSubmitted(false), SUCCESS_AUTO_HIDE_MS);
    } catch (err) {
      setError((err as Error).message || 'Submission failed');
    }
  };

  return (
    <div className="preview-questions" data-preview-page-version="0.1">
      <header className="preview-questions__header">
        <h1 className="preview-questions__title">Preview Questions</h1>
        <p className="preview-questions__lede">Ask us anything about the mission, roadmap, architecture, or how to get involved. This form is ephemeral during early preview.</p>
      </header>
      <main className="preview-questions__main">
        {lastSubmission && (
          <aside className="preview-questions__last" aria-label="Last submitted question" data-testid="last-submission">
            <h2 className="preview-questions__last-title">Last submitted</h2>
            <p className="preview-questions__last-snippet">{lastSubmission.snippet}{lastSubmission.question.length > lastSubmission.snippet.length ? '…' : ''}</p>
            <time className="preview-questions__last-time" dateTime={lastSubmission.ts}>{new Date(lastSubmission.ts).toLocaleString()}</time>
          </aside>
        )}
        <form onSubmit={onSubmit} aria-describedby="preview-form-desc" className="preview-questions__form" noValidate>
          <p id="preview-form-desc" className="preview-questions__desc">We don’t store your data yet — submissions only help shape upcoming FAQ & community onboarding.</p>
          {error && <div role="alert" className="preview-questions__error">{error}</div>}
          {submitted && <div role="status" className="preview-questions__success preview-questions__success--active">Thanks — your question was noted (locally).</div>}
          {rateInfo && (
            <div className="preview-questions__rate" aria-live="polite">
              <small>Remaining this hour: {rateInfo.remaining}{rateInfo.resetAt ? ` (resets in ${Math.max(0, Math.round((rateInfo.resetAt - Date.now())/60000))}m)` : ''}</small>
            </div>
          )}
          <div className="preview-field-group">
            <label htmlFor="pq-name">Name (optional)</label>
            <input
              id="pq-name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={onChange}
              className="preview-input"
            />
          </div>
          <div className="preview-field-group">
            <label htmlFor="pq-email">Email (optional)</label>
            <input
              id="pq-email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={onChange}
              className="preview-input"
            />
          </div>
          <div className="preview-field-group">
            <label htmlFor="pq-question">Your question<span aria-hidden="true"> *</span></label>
            <textarea
              id="pq-question"
              name="question"
              rows={5}
              required
              value={form.question}
              onChange={onChange}
              className="preview-textarea"
            />
          </div>
          <div className="preview-actions">
            <button type="submit" className="btn-primary">Submit question</button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default PreviewQuestions;
