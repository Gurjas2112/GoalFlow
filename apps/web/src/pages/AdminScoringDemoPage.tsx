import { useState } from 'react';

const UOM_FORMULAS: Record<string, { formula: string; desc: string; example: string }> = {
  NUMERIC_MIN: {
    formula: 'Score = min(actual / target, 1.0)',
    desc: 'Higher is better — rewards exceeding targets',
    example: 'Revenue target: ₹10L, Actual: ₹8.5L → 85%',
  },
  NUMERIC_MAX: {
    formula: 'Score = min(target / actual, 1.0)',
    desc: 'Lower is better — rewards efficiency',
    example: 'TAT target: 24h, Actual: 28h → 85.7%',
  },
  TIMELINE: {
    formula: 'On time → 1.0 | Late → max(1 - daysLate/totalDays, 0)',
    desc: 'Date-based delivery tracking',
    example: 'Deadline: Sep 30, Completed: Oct 15 → penalty applied',
  },
  ZERO: {
    formula: 'actual == 0 → 1.0 | else → max(1 - actual×0.2, 0)',
    desc: 'Zero incidents = perfect score',
    example: 'Target: 0 incidents, Actual: 2 → 60%',
  },
};

export default function AdminScoringDemoPage() {
  const [uomType, setUomType] = useState('NUMERIC_MIN');
  const [target, setTarget] = useState(1000000);
  const [actual, setActual] = useState(850000);
  const [weightage, setWeightage] = useState(30);

  const computeScore = (): number => {
    switch (uomType) {
      case 'NUMERIC_MIN':
        return target === 0 ? 0 : Math.min(actual / target, 1.0);
      case 'NUMERIC_MAX':
        return actual === 0 ? 1.0 : Math.min(target / actual, 1.0);
      case 'ZERO':
        return actual === 0 ? 1.0 : Math.max(1 - actual * 0.2, 0);
      case 'TIMELINE':
        return actual <= 0 ? 1.0 : Math.max(1 - actual * 0.05, 0);
      default:
        return 0;
    }
  };

  const score = computeScore();
  const contribution = (score * weightage).toFixed(1);
  const info = UOM_FORMULAS[uomType];

  const getScoreColor = (s: number) => {
    if (s >= 0.9) return 'var(--success)';
    if (s >= 0.7) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="page-content" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="page-header">
        <h2>💯 Score Computation Engine</h2>
        <p className="page-subtitle">Interactive calculator — demonstrates all 4 UoM scoring formulas</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3>Unit of Measurement</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {Object.keys(UOM_FORMULAS).map((type) => (
              <button
                key={type}
                className={`btn ${uomType === type ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => {
                  setUomType(type);
                  if (type === 'NUMERIC_MIN') { setTarget(1000000); setActual(850000); }
                  if (type === 'NUMERIC_MAX') { setTarget(24); setActual(28); }
                  if (type === 'ZERO') { setTarget(0); setActual(2); }
                  if (type === 'TIMELINE') { setTarget(0); setActual(15); }
                }}
                style={{ fontSize: 13, padding: '10px 14px' }}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="card" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: 16 }}>
            <code style={{ fontSize: 14, color: 'var(--primary)' }}>{info.formula}</code>
            <p style={{ fontSize: 13, margin: '8px 0 4px', opacity: 0.8 }}>{info.desc}</p>
            <p style={{ fontSize: 12, opacity: 0.6 }}>Example: {info.example}</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3>Input Values</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">
                {uomType === 'TIMELINE' ? 'Days Late' : uomType === 'ZERO' ? 'Incidents' : 'Target'}
              </label>
              <input
                type="number"
                className="form-input"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                disabled={uomType === 'ZERO' || uomType === 'TIMELINE'}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                {uomType === 'TIMELINE' ? 'Days Late' : 'Actual'}
              </label>
              <input
                type="number"
                className="form-input"
                value={actual}
                onChange={(e) => setActual(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Weightage (%)</label>
              <input
                type="number"
                className="form-input"
                value={weightage}
                onChange={(e) => setWeightage(Number(e.target.value))}
                min={10}
                max={100}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(52,211,153,0.1))' }}>
        <div className="card-body" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: getScoreColor(score), marginBottom: 8 }}>
            {(score * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 16 }}>Goal Achievement Score</div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, fontSize: 14 }}>
            <div>
              <div style={{ opacity: 0.6 }}>Weightage</div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{weightage}%</div>
            </div>
            <div>
              <div style={{ opacity: 0.6 }}>Contribution</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary)' }}>{contribution}%</div>
            </div>
          </div>

          <p style={{ fontSize: 12, opacity: 0.5, marginTop: 16 }}>
            This goal contributes <strong>{contribution}%</strong> to the overall weighted performance score
          </p>
        </div>
      </div>
    </div>
  );
}
