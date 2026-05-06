import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  children: ReactNode;
  right?: ReactNode;
  caption?: string;
  style?: React.CSSProperties;
  noPad?: boolean;
}

const MONO: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

export default function ChartCard({ title, children, right, caption, style, noPad }: ChartCardProps) {
  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--line)',
      marginBottom: 16,
      overflow: 'hidden',
      ...style,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--bg-2)',
      }}>
        <span style={{ ...MONO, fontSize: 11, color: 'var(--text)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{title}</span>
        {right && <div>{right}</div>}
      </div>
      <div style={{
        padding: noPad ? 0 : '20px',
        background: `
          repeating-linear-gradient(0deg,transparent 0,transparent 39px,rgba(255,255,255,0.018) 39px,rgba(255,255,255,0.018) 40px),
          repeating-linear-gradient(90deg,transparent 0,transparent 39px,rgba(255,255,255,0.018) 39px,rgba(255,255,255,0.018) 40px),
          var(--panel)
        `,
      }}>
        {children}
      </div>
      {caption && (
        <div style={{
          ...MONO, padding: '10px 20px', fontSize: 10,
          color: 'var(--text-dim)', borderTop: '1px solid var(--line)', background: 'var(--bg-2)',
        }}>{caption}</div>
      )}
    </div>
  );
}
