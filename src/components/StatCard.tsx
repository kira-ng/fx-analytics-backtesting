interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  valueColor?: string;
  pill?: string;
  pillColor?: string;
}

const MONO: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };
const SERIF: React.CSSProperties = { fontFamily: 'Fraunces, serif' };

export default function StatCard({ label, value, sub, valueColor, pill, pillColor }: StatCardProps) {
  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--line)',
      padding: '14px 18px',
      minWidth: 0,
    }}>
      <div style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ ...SERIF, fontSize: 24, fontWeight: 600, color: valueColor ?? 'var(--text)', lineHeight: 1.1 }}>
          {value}
        </span>
        {pill && (
          <span style={{
            ...MONO, fontSize: 10, letterSpacing: '0.06em',
            background: (pillColor ?? 'var(--bull)') + '22',
            color: pillColor ?? 'var(--bull)',
            borderRadius: 2, padding: '2px 7px',
          }}>{pill}</span>
        )}
      </div>
      {sub && <div style={{ ...MONO, fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
