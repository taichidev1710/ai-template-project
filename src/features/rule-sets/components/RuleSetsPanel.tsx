import { useState } from 'react';
import { App, Button, Collapse, Empty, Space, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { BlockType, Relation } from '@/domain/diagram';
import { RuleSetFormModal } from './RuleSetFormModal';
import { RuleFormModal } from './RuleFormModal';
import { useRuleSets, useRuleSetMutations } from '../hooks/use-rule-sets';
import { describeRule } from '../types';
import type { Rule, RuleSet, RuleSetInput, RuleInput } from '../types';

interface RuleSetsPanelProps {
  typeId: string;
  blockTypes: BlockType[];
  relations: Relation[];
}

/** The "Bộ luật" tab — rule sets of a Loại sơ đồ, each holding rules (5 kinds). */
export function RuleSetsPanel({ typeId, blockTypes, relations }: RuleSetsPanelProps) {
  const { modal } = App.useApp();
  const { data: ruleSets } = useRuleSets(typeId);
  const m = useRuleSetMutations(typeId);

  const [setModal, setSetModal] = useState<{ open: boolean; editing: RuleSet | null }>({ open: false, editing: null });
  const [ruleModal, setRuleModal] = useState<{ open: boolean; setId: string; editing: Rule | null }>({ open: false, setId: '', editing: null });

  const blockName = (id: string) => blockTypes.find((b) => b.id === id)?.name ?? id;
  const relName = (id: string) => relations.find((r) => r.id === id)?.name ?? id;

  const submitSet = (values: RuleSetInput) => {
    const onDone = () => setSetModal({ open: false, editing: null });
    if (setModal.editing) m.updateSet.mutate({ id: setModal.editing.id, input: values }, { onSuccess: onDone });
    else m.createSet.mutate(values, { onSuccess: onDone });
  };

  const submitRule = (values: RuleInput) => {
    const onDone = () => setRuleModal({ open: false, setId: '', editing: null });
    if (ruleModal.editing) m.updateRule.mutate({ setId: ruleModal.setId, ruleId: ruleModal.editing.id, input: values }, { onSuccess: onDone });
    else m.addRule.mutate({ setId: ruleModal.setId, input: values }, { onSuccess: onDone });
  };

  const confirmDeleteSet = (rs: RuleSet) =>
    modal.confirm({
      title: `Xoá bộ luật “${rs.name}”?`,
      okText: 'Xoá',
      okButtonProps: { danger: true },
      cancelText: 'Huỷ',
      onOk: () => m.removeSet.mutateAsync(rs.id),
    });

  const confirmDeleteRule = (setId: string, rule: Rule) =>
    modal.confirm({
      title: 'Xoá luật này?',
      content: describeRule(rule, blockName, relName),
      okText: 'Xoá',
      okButtonProps: { danger: true },
      cancelText: 'Huỷ',
      onOk: () => m.removeRule.mutateAsync({ setId, ruleId: rule.id }),
    });

  const sets = ruleSets ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Typography.Text type="secondary" className="text-xs">
          Mỗi bộ luật là một gói ràng buộc; sơ đồ chọn loại này rồi tick bộ luật muốn áp.
        </Typography.Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setSetModal({ open: true, editing: null })}>
          Thêm bộ luật
        </Button>
      </div>

      {sets.length === 0 ? (
        <Empty description="Chưa có bộ luật nào" />
      ) : (
        <Collapse
          defaultActiveKey={sets[0] ? [sets[0].id] : []}
          items={sets.map((rs) => ({
            key: rs.id,
            label: (
              <Space>
                <span>{rs.icon ?? '⚖️'}</span>
                <span className="font-medium">{rs.name}</span>
                <Tag color="gold">{rs.rules.length} luật</Tag>
                {rs.builtin && <Tag>mẫu</Tag>}
              </Space>
            ),
            extra: (
              <Space onClick={(e) => e.stopPropagation()}>
                <Button type="text" size="small" icon={<EditOutlined />} aria-label="Edit set" onClick={() => setSetModal({ open: true, editing: rs })} />
                <Button type="text" size="small" danger icon={<DeleteOutlined />} aria-label="Delete set" onClick={() => confirmDeleteSet(rs)} />
              </Space>
            ),
            children: (
              <div>
                {rs.description && (
                  <Typography.Paragraph type="secondary" className="text-xs">
                    {rs.description}
                  </Typography.Paragraph>
                )}
                <div className="flex flex-col gap-2">
                  {rs.rules.length === 0 ? (
                    <Typography.Text type="secondary" className="text-xs">
                      Chưa có luật.
                    </Typography.Text>
                  ) : (
                    rs.rules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between gap-2 rounded-app bg-canvas px-3 py-2">
                        <Typography.Text className="text-sm">{describeRule(rule, blockName, relName)}</Typography.Text>
                        <Space>
                          <Button type="text" size="small" icon={<EditOutlined />} aria-label="Edit rule" onClick={() => setRuleModal({ open: true, setId: rs.id, editing: rule })} />
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} aria-label="Delete rule" onClick={() => confirmDeleteRule(rs.id, rule)} />
                        </Space>
                      </div>
                    ))
                  )}
                </div>
                <Button className="mt-3" size="small" icon={<PlusOutlined />} onClick={() => setRuleModal({ open: true, setId: rs.id, editing: null })}>
                  Thêm luật
                </Button>
              </div>
            ),
          }))}
        />
      )}

      <RuleSetFormModal
        open={setModal.open}
        initialValue={setModal.editing}
        confirmLoading={m.createSet.isPending || m.updateSet.isPending}
        onSubmit={submitSet}
        onCancel={() => setSetModal({ open: false, editing: null })}
      />
      <RuleFormModal
        open={ruleModal.open}
        initialValue={ruleModal.editing}
        blockTypes={blockTypes}
        relations={relations}
        confirmLoading={m.addRule.isPending || m.updateRule.isPending}
        onSubmit={submitRule}
        onCancel={() => setRuleModal({ open: false, setId: '', editing: null })}
      />
    </div>
  );
}
