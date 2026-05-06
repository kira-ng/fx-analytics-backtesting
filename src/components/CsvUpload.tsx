import { useRef, useState } from 'react';
import type { Trade } from '../types';
import { parseCSV } from '../utils/csvParser';

interface CsvUploadProps {
  onLoad: (trades: Trade[]) => void;
}

export default function CsvUpload({ onLoad }: CsvUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    if (!file.name.endsWith('.csv')) { setError('Please upload a CSV file'); return; }
    try {
      const trades = await parseCSV(file);
      setError('');
      onLoad(trades);
    } catch {
      setError('Failed to parse CSV. Check the format matches the template.');
    }
  }

  return (
    <div style={{ textAlign: 'center', padding: '80px 32px' }}>
      <div style={{
        fontFamily: 'Fraunces, serif',
        fontSize: 'clamp(48px, 7vw, 96px)',
        fontWeight: 900,
        lineHeight: 0.95,
        letterSpacing: '-0.03em',
        marginBottom: 24,
      }}>
        FX <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--accent)' }}>Analytics</em>
      </div>
      <p style={{ color: 'var(--text-dim)', fontSize: 18, marginBottom: 48, maxWidth: 520, margin: '0 auto 48px' }}>
        Upload your backtest CSV to analyze performance, drawdown, and run simulations.
      </p>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        style={{
          border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--line)'}`,
          padding: '64px 48px',
          cursor: 'pointer',
          maxWidth: 560,
          margin: '0 auto',
          background: dragging ? 'rgba(255,181,71,0.04)' : 'var(--panel)',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
          DROP CSV FILE HERE
        </div>
        <div style={{ color: 'var(--text-faint)', fontSize: 12, marginTop: 8, fontFamily: 'JetBrains Mono, monospace' }}>
          or click to browse
        </div>
        <input ref={inputRef} type="file" accept=".csv" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      {error && (
        <div style={{
          color: 'var(--bear)', fontFamily: 'JetBrains Mono, monospace',
          fontSize: 12, marginTop: 16,
        }}>{error}</div>
      )}

      <div style={{ marginTop: 32, color: 'var(--text-faint)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
        Expected columns: id, dateStart, dateEnd, pair, rPnL, side, avgRiskReward, maxRiskReward, status, initialBalance, ...
      </div>
    </div>
  );
}
