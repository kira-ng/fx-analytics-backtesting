import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  info?: string;
  right?: ReactNode;
}

const MONO: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

export default function SectionHeader({ title, info, right }: SectionHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{title}</span>
        {info && <span title={info} style={{ ...MONO, fontSize: 11, color: 'var(--text-dim)', cursor: 'default' }}>ⓘ</span>}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}
