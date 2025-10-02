import React from 'react';

// Simplified static preview page: display two curated preview questions only.
// All prior submission / rate limit / localStorage logic removed per request.
// If future interactivity returns, restore from VCS history.

const STATIC_QUESTIONS: { q: string; a?: string }[] = [
  { q: 'How will humans and AI collaborate here?', a: 'Through transparent tools, open metrics, and community-shaped guidelines.' },
  { q: 'What happens next after the preview?', a: 'We iterate on visual language and release a participation SDK stub.' }
];

const PreviewQuestions: React.FC = () => {
  return (
    <div className="preview-questions" data-preview-page-version="static-1">
      <header className="preview-questions__header">
        <h1 className="preview-questions__title">Preview</h1>
        <p className="preview-questions__lede">Early visual + motion exploration. Two seed questions we posed internally:</p>
      </header>
      <main className="preview-questions__main" aria-live="polite">
        <ul className="preview-questions__list" data-testid="static-question-list">
          {STATIC_QUESTIONS.map((item, i) => (
            <li key={i} className="preview-questions__item">
              <h2 className="preview-questions__q">{item.q}</h2>
              {item.a && <p className="preview-questions__a">{item.a}</p>}
            </li>
          ))}
        </ul>
        <div className="preview-questions__note">More coming soon — interactive submission removed for this phase.</div>
      </main>
    </div>
  );
};

export default PreviewQuestions;
