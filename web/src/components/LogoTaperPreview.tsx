import React, { useState, useMemo } from 'react';
import LogoHumanAI, { type LogoMetrics } from './LogoHumanAI';
import './LogoTaperPreview.css';

interface ControlSpec {
  label: string;
  min: number; max: number; step: number;
}

const slider: ControlSpec = { label: 'Taper Strength', min: 0, max: 1, step: 0.01 };

const LogoTaperPreview: React.FC = () => {
  const [enabled, setEnabled] = useState(true);
  const [strength, setStrength] = useState(0.6);
  const [verticalFactor, setVerticalFactor] = useState(0.7);
  const [arcMode, setArcMode] = useState<'parametric' | 'legacy' | 'clipped'>('parametric');
  const [showDebug, setShowDebug] = useState(false);
  const [uniformMetrics, setUniformMetrics] = useState<LogoMetrics | null>(null);
  const [taperMetrics, setTaperMetrics] = useState<LogoMetrics | null>(null);

  const metricsKey = useMemo(() => `${enabled}-${strength}-${verticalFactor}-${arcMode}`, [enabled, strength, verticalFactor, arcMode]);

  return (
    <section className="section section--logo-preview" aria-labelledby="logo-preview-heading">
      <h2 id="logo-preview-heading">Logo Taper Preview</h2>
      <p className="preview-intro">Compare the uniform form (left) with the inward-tapered form (right). Adjust parameters to evaluate proportion resilience.</p>
      <div className="preview-controls" role="group" aria-label="Taper controls">
        <label title={arcMode !== 'parametric' ? 'Taper only applies in parametric mode' : undefined}>
          <input
            type="checkbox"
            checked={enabled && arcMode === 'parametric'}
            disabled={arcMode !== 'parametric'}
            onChange={e=>setEnabled(e.target.checked)} /> Enable taper
        </label>
        <label style={{opacity: enabled && arcMode==='parametric' ? 1 : 0.35}} title={arcMode !== 'parametric' ? 'Switch arc mode to parametric to adjust taper' : undefined}>
          {slider.label}: <input type="range" min={slider.min} max={slider.max} step={slider.step} value={strength} disabled={!enabled || arcMode!=='parametric'} onChange={e=>setStrength(parseFloat(e.target.value))} /> <span>{strength.toFixed(2)}</span>
        </label>
        <label>
          Vertical factor: <input type="range" min={0.4} max={1} step={0.01} value={verticalFactor} onChange={e=>setVerticalFactor(parseFloat(e.target.value))} /> <span>{verticalFactor.toFixed(2)}</span>
        </label>
        <label>
          Arc mode: {' '}
          <select value={arcMode} onChange={e=>setArcMode(e.target.value as 'parametric' | 'legacy' | 'clipped')}>
            <option value="parametric">parametric</option>
            <option value="legacy">legacy</option>
            <option value="clipped">clipped</option>
          </select>
        </label>
        <label>
          <input type="checkbox" checked={showDebug} onChange={e=>setShowDebug(e.target.checked)} /> Show debug guides
        </label>
      </div>
      <div className="preview-grid" key={metricsKey}>
        <div className="preview-cell" aria-label="Uniform variant">
          <div className="preview-label">Uniform</div>
          <LogoHumanAI
            arcMode={arcMode}
            verticalFactor={verticalFactor}
            taperEnabled={false}
            taperStrength={0}
            showDebug={showDebug}
            stacked={false}
            withWordmark={false}
            onMetrics={m=>setUniformMetrics(m)}
          />
          {uniformMetrics && (
            <dl style={{margin: '0.5rem 0 0', fontSize: '0.6rem', lineHeight: 1.15, opacity: 0.75}}>
              <div><dt style={{display:'inline'}}>pillar</dt>: <dd style={{display:'inline', margin:0}}>{uniformMetrics.pillarWidth.toFixed(2)}</dd></div>
              {typeof uniformMetrics.arcMinThickness==='number' && <div><dt style={{display:'inline'}}>arcMin</dt>: <dd style={{display:'inline', margin:0}}>{uniformMetrics.arcMinThickness.toFixed(2)}</dd></div>}
            </dl>
          )}
        </div>
        <div className="preview-cell" aria-label="Tapered variant">
          <div className="preview-label">Tapered</div>
          <LogoHumanAI
            arcMode={arcMode}
            verticalFactor={verticalFactor}
            taperEnabled={enabled && arcMode==='parametric'}
            taperStrength={strength}
            showDebug={showDebug}
            stacked={false}
            withWordmark={false}
            onMetrics={m=>setTaperMetrics(m)}
          />
          {taperMetrics && (
            <dl style={{margin: '0.5rem 0 0', fontSize: '0.6rem', lineHeight: 1.15, opacity: 0.75}}>
              <div><dt style={{display:'inline'}}>pillar</dt>: <dd style={{display:'inline', margin:0}}>{taperMetrics.pillarWidth.toFixed(2)}</dd></div>
              {typeof taperMetrics.arcMinThickness==='number' && <div><dt style={{display:'inline'}}>arcMin</dt>: <dd style={{display:'inline', margin:0}}>{taperMetrics.arcMinThickness.toFixed(2)}</dd></div>}
              {typeof taperMetrics.pillarMinWidth==='number' && <div><dt style={{display:'inline'}}>pillarMin</dt>: <dd style={{display:'inline', margin:0}}>{taperMetrics.pillarMinWidth.toFixed(2)}</dd></div>}
            </dl>
          )}
          {arcMode!=='parametric' && (
            <div style={{marginTop:'0.4rem', fontSize:'0.55rem', opacity:0.6}}>
              Taper inactive in {arcMode} mode.
            </div>
          )}
        </div>
      </div>
      <details className="preview-notes">
        <summary>Notes</summary>
        <ul>
          <li>Taper keeps outer arc contour invariant; only inner arc + pillar midline pinch.</li>
          <li>Thick:thin ratio approaches φ at strength = 1.0.</li>
          <li>Debug overlays show clearance, golden annotations, and mid clearances.</li>
          <li>Metrics below each variant update live; arcMin is minimum arc thickness at midpoint.</li>
          <li>Switch to parametric mode to enable taper geometry.</li>
        </ul>
      </details>
    </section>
  );
};

export default LogoTaperPreview;
