import { Button, Select, Tag, Typography } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { PatternDiagram } from './PatternDiagram';
import { directionPhrase, relationEndLabels } from '../types';
import type { BaseRelation, RelationStep, StepDir } from '../types';

interface PatternBuilderProps {
  value?: RelationStep[];
  onChange?: (value: RelationStep[]) => void;
  /** Base relations of this type — each hop walks one of them. */
  baseRelations: BaseRelation[];
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
    const l = rel ? relationEndLabels(rel) : { up: 'ngược chiều (←)', down: 'theo chiều (→)' };
    return [
      { value: 'down' as StepDir, label: l.down },
      { value: 'up' as StepDir, label: l.up },
      { value: 'both' as StepDir, label: 'cả hai chiều (↔)' },
    ];
  };

  const summary = value.length
    ? 'Từ một khối: ' +
      value.map((s) => `đi theo ${relById(s.relationId)?.name ?? '?'} ${directionPhrase(relById(s.relationId), s.dir)}`).join(', rồi ') +
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

      {value.length > 0 && (
        <div className="mt-3 rounded-app bg-canvas px-3 py-2">
          <div className="mb-1 text-[11px] font-medium text-muted">Sơ đồ minh hoạ</div>
          <PatternDiagram pattern={value} baseRelations={baseRelations} />
          <Typography.Text className="mt-1 block text-xs">🧭 {summary}</Typography.Text>
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
