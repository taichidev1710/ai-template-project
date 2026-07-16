import { Button, Select, Tag, Typography } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import type { BaseRelation, RelationStep, StepDir } from '../types';

interface PatternBuilderProps {
  value?: RelationStep[];
  onChange?: (value: RelationStep[]) => void;
  /** Base relations of this type — each hop walks one of them. */
  baseRelations: BaseRelation[];
}

/**
 * Plain-language direction labels for a relation. A relation named "A – B" reads
 * naturally ("về phía B" / "về phía A"); otherwise fall back to generic wording.
 */
function endLabels(rel: BaseRelation): { up: string; down: string } {
  const parts = rel.name
    .split(/[–\-/]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return { up: `về phía ${parts[0]!.toLowerCase()}`, down: `về phía ${parts[parts.length - 1]!.toLowerCase()}` };
  }
  return { up: 'ngược chiều (←)', down: 'theo chiều (→)' };
}

/**
 * Guided, sentence-style builder for a derived relation's path. Each step is a
 * row: "đi theo [quan hệ] [về phía …]". Replaces the abstract ↑/↓/↔ arrows so a
 * user can compose ANY relation (incl. in-laws) without thinking in graph hops.
 */
export function PatternBuilder({ value = [], onChange, baseRelations }: PatternBuilderProps) {
  const primary = baseRelations.find((r) => r.role === 'primary') ?? baseRelations[0];
  const relById = (id: string) => baseRelations.find((r) => r.id === id);

  const setStep = (i: number, patch: Partial<RelationStep>) =>
    onChange?.(value.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const addStep = () => primary && onChange?.([...value, { relationId: primary.id, dir: 'down' }]);
  const removeStep = (i: number) => onChange?.(value.filter((_, idx) => idx !== i));

  const dirOptions = (rel?: BaseRelation) => {
    const l = rel ? endLabels(rel) : { up: 'ngược chiều (←)', down: 'theo chiều (→)' };
    return [
      { value: 'down' as StepDir, label: l.down },
      { value: 'up' as StepDir, label: l.up },
      { value: 'both' as StepDir, label: 'cả hai chiều (↔)' },
    ];
  };

  const summary = value.length
    ? 'Từ một khối: ' +
      value
        .map((s) => {
          const rel = relById(s.relationId);
          const l = rel ? endLabels(rel) : { up: '', down: '' };
          const dirTxt = s.dir === 'both' ? 'cả hai chiều' : s.dir === 'down' ? l.down : l.up;
          return `đi theo ${rel?.name ?? '?'} ${dirTxt}`;
        })
        .join(', rồi ') +
      '.'
    : '';

  return (
    <div>
      <div className="flex flex-col gap-2">
        {value.length === 0 && (
          <Typography.Text type="secondary" className="text-xs">
            Chưa có bước nào — bấm “Thêm bước”.
          </Typography.Text>
        )}
        {value.map((s, i) => {
          const rel = relById(s.relationId);
          return (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <Tag color="blue">Bước {i + 1}</Tag>
              <span className="text-muted text-xs">đi theo</span>
              <Select
                size="small"
                value={s.relationId}
                onChange={(v) => setStep(i, { relationId: v, dir: 'down' })}
                style={{ minWidth: 150 }}
                options={baseRelations.map((r) => ({ value: r.id, label: r.name }))}
              />
              <Select
                size="small"
                value={s.dir}
                onChange={(v) => setStep(i, { dir: v })}
                style={{ minWidth: 170 }}
                options={dirOptions(rel)}
              />
              <Button size="small" type="text" danger icon={<CloseOutlined />} aria-label="Xoá bước" onClick={() => removeStep(i)} />
            </div>
          );
        })}
      </div>

      <div className="mt-2">
        <Button size="small" icon={<PlusOutlined />} onClick={addStep} disabled={!primary}>
          Thêm bước
        </Button>
      </div>

      {summary && (
        <div className="mt-2 rounded-app bg-canvas px-3 py-2">
          <Typography.Text className="text-xs">🧭 {summary}</Typography.Text>
        </div>
      )}
      <div className="mt-1">
        <Typography.Text type="secondary" className="text-xs">
          VD: con → vợ/chồng của họ = con dâu/rể · cha mẹ → cha mẹ = ông bà.
        </Typography.Text>
      </div>
    </div>
  );
}
