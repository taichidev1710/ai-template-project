import { useState } from 'react';
import { Button, Select, Space, Tag, Typography } from 'antd';
import { DIR_ARROW } from '../types';
import type { BaseRelation, RelationStep, StepDir } from '../types';

interface PatternBuilderProps {
  value?: RelationStep[];
  onChange?: (value: RelationStep[]) => void;
  /** Base relations of this type — each hop walks one of them. */
  baseRelations: BaseRelation[];
}

const DIR_LABEL: Record<StepDir, string> = { up: '↑ Lên', down: '↓ Xuống', both: '↔ Hai chiều' };

/**
 * Declares a derived relation as a sequence of hops. Each hop = a base relation
 * + a direction, so paths can mix relations (e.g. ↓ Cha–con → ↔ Vợ chồng =
 * con dâu/rể). The relation defaults to the primary one, so simple same-relation
 * paths (ông bà = ↑↑) stay quick.
 */
export function PatternBuilder({ value = [], onChange, baseRelations }: PatternBuilderProps) {
  const primary = baseRelations.find((r) => r.role === 'primary') ?? baseRelations[0];
  const [relId, setRelId] = useState<string | undefined>(primary?.id);
  const activeRel = relId ?? primary?.id;
  const relName = (id: string) => baseRelations.find((r) => r.id === id)?.name ?? id;

  const add = (dir: StepDir) => {
    if (!activeRel) return;
    onChange?.([...value, { relationId: activeRel, dir }]);
  };
  const pop = () => onChange?.(value.slice(0, -1));

  return (
    <div>
      <div className="mb-2 flex min-h-[34px] flex-wrap items-center gap-1 rounded-app bg-canvas px-2 py-1">
        {value.length === 0 ? (
          <Typography.Text type="secondary" className="text-xs">
            Chưa có bước nào — chọn quan hệ rồi thêm ↑/↓/↔
          </Typography.Text>
        ) : (
          value.map((s, i) => (
            <Tag key={i} color={s.dir === 'up' ? 'geekblue' : s.dir === 'down' ? 'volcano' : 'purple'}>
              {DIR_ARROW[s.dir]} {relName(s.relationId)}
            </Tag>
          ))
        )}
      </div>

      <Space wrap>
        <Select
          size="small"
          value={activeRel}
          onChange={setRelId}
          style={{ minWidth: 150 }}
          options={baseRelations.map((r) => ({ value: r.id, label: r.name }))}
          placeholder="Quan hệ"
        />
        {(['up', 'down', 'both'] as StepDir[]).map((dir) => (
          <Button key={dir} size="small" onClick={() => add(dir)} disabled={!activeRel}>
            {DIR_LABEL[dir]}
          </Button>
        ))}
        <Button size="small" onClick={pop} disabled={value.length === 0}>
          Xoá bước cuối
        </Button>
      </Space>

      <div className="mt-1">
        <Typography.Text type="secondary" className="text-xs">
          VD (Cha–con): ↑↑ = ông bà · ↑↓ = anh chị em · ↓↓ = cháu. Trộn: ↓ Cha–con → ↔ Vợ chồng = con dâu/rể.
        </Typography.Text>
      </div>
    </div>
  );
}
