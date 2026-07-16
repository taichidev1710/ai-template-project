import { Fragment } from 'react';
import { Typography } from 'antd';
import { directionPhrase, reachedNoun } from '../types';
import type { BaseRelation, RelationStep } from '../types';

interface PatternDiagramProps {
  pattern: RelationStep[];
  baseRelations: BaseRelation[];
}

function NodeChip({ label, tone }: { label: string; tone: 'start' | 'mid' | 'end' }) {
  const ring = tone === 'start' ? 'var(--app-color-primary)' : tone === 'end' ? 'var(--app-color-success)' : 'var(--app-color-border)';
  const fill = tone === 'mid' ? 'var(--app-color-bg-container)' : ring;
  return (
    <div className="flex shrink-0 flex-col items-center gap-1" style={{ width: 64 }}>
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: 28, height: 28, border: `2px solid ${ring}`, background: tone === 'mid' ? 'transparent' : fill, opacity: tone === 'mid' ? 0.6 : 1 }}
      />
      <span className="text-center text-[10px] leading-tight text-muted">{label}</span>
    </div>
  );
}

function Connector({ name, phrase }: { name: string; phrase: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center justify-center px-1" style={{ minWidth: 96 }}>
      <span className="max-w-[96px] truncate text-center text-[10px] font-medium">{name}</span>
      <span className="text-base leading-none text-muted">──▶</span>
      <span className="max-w-[96px] text-center text-[10px] text-muted">{phrase}</span>
    </div>
  );
}

/**
 * A schematic of ONE representative path for the derived relation: start block
 * → (hop) → node → (hop) → result. Not real data — it visualizes what the
 * pattern means, updating live as steps change.
 */
export function PatternDiagram({ pattern, baseRelations }: PatternDiagramProps) {
  const relById = (id: string) => baseRelations.find((r) => r.id === id);

  if (pattern.length === 0) {
    return (
      <Typography.Text type="secondary" className="text-xs">
        Thêm bước để xem sơ đồ minh hoạ.
      </Typography.Text>
    );
  }

  return (
    <div className="flex items-start gap-1 overflow-x-auto pb-1">
      <NodeChip label="Khối gốc" tone="start" />
      {pattern.map((s, i) => {
        const rel = relById(s.relationId);
        const isLast = i === pattern.length - 1;
        const noun = reachedNoun(rel, s.dir);
        return (
          <Fragment key={i}>
            <Connector name={rel?.name ?? '?'} phrase={directionPhrase(rel, s.dir)} />
            <NodeChip label={isLast ? `${noun} ⟵ kết quả` : noun} tone={isLast ? 'end' : 'mid'} />
          </Fragment>
        );
      })}
    </div>
  );
}
