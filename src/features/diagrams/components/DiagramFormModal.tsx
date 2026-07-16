import { useEffect, useState } from 'react';
import { Checkbox, Form, Input, Modal, Select, Space, Tag, Typography } from 'antd';
import type { DiagramTemplate } from '@/features/diagram-types';
import type { Diagram, DiagramInput } from '../types';

interface DiagramFormModalProps {
  open: boolean;
  initialValue?: Diagram | null;
  types: DiagramTemplate[];
  confirmLoading?: boolean;
  onSubmit: (values: DiagramInput) => void;
  onCancel: () => void;
}

const DEFAULTS = { name: '', templateId: undefined, ruleSetIds: [] };

/**
 * Create/edit a Sơ đồ: name + the Loại sơ đồ that owns its vocabulary + which of
 * THAT type's rule sets to apply. Only rule sets of the picked type are offered,
 * so a diagram can never apply rules written against another type's blocks.
 */
export function DiagramFormModal({ open, initialValue, types, confirmLoading, onSubmit, onCancel }: DiagramFormModalProps) {
  const [form] = Form.useForm<DiagramInput>();
  const isEdit = Boolean(initialValue);

  // State, not `Form.useWatch`: with `destroyOnHidden` the form unmounts on
  // close and useWatch warns it has no Form (same note as in
  // relation-types/RelationFormModal).
  const [templateId, setTemplateId] = useState<string>();
  const selectedType = types.find((t) => t.id === templateId);

  // Nodes and edges reference the type's block types / relations, so the type is
  // only swappable while the canvas is still empty.
  const locked = Boolean(initialValue && (initialValue.nodes.length > 0 || initialValue.edges.length > 0));

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(
      initialValue
        ? { name: initialValue.name, templateId: initialValue.templateId, ruleSetIds: initialValue.ruleSetIds }
        : DEFAULTS,
    );
    setTemplateId(initialValue?.templateId);
  }, [open, initialValue, form]);

  /** Switching type invalidates the old ticks; default to applying all of the new type's sets. */
  const handleTypeChange = (id: string) => {
    const next = types.find((t) => t.id === id);
    setTemplateId(id);
    form.setFieldValue('ruleSetIds', next?.ruleSets.map((rs) => rs.id) ?? []);
  };

  const ruleSetsHint = !selectedType
    ? 'Chọn loại sơ đồ trước để thấy các bộ luật của nó.'
    : selectedType.ruleSets.length === 0
      ? 'Loại này chưa có bộ luật nào — sơ đồ sẽ không bị ràng buộc.'
      : 'Tick bộ nào thì áp bộ đó. Không tick bộ nào = vẽ tự do.';

  return (
    <Modal
      open={open}
      title={isEdit ? 'Sửa sơ đồ' : 'Thêm sơ đồ'}
      okText="Lưu"
      cancelText="Huỷ"
      confirmLoading={confirmLoading}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form<DiagramInput> form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
        <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Nhập tên sơ đồ' }]}>
          <Input placeholder="VD: Sơ đồ phòng Kỹ thuật" />
        </Form.Item>

        <Form.Item
          name="templateId"
          label="Loại sơ đồ"
          rules={[{ required: true, message: 'Chọn loại sơ đồ' }]}
          extra={
            locked
              ? 'Sơ đồ đã có khối/liên kết nên không đổi được loại — vốn từ vựng đang được dùng.'
              : 'Loại sơ đồ sở hữu vốn từ vựng: khối, quan hệ và bộ luật của sơ đồ này.'
          }
        >
          <Select
            disabled={locked}
            placeholder="Chọn loại sơ đồ"
            onChange={handleTypeChange}
            options={types.map((t) => ({
              value: t.id,
              label: `${t.icon ?? '📊'} ${t.name}`,
            }))}
          />
        </Form.Item>

        {selectedType && (
          <Space size={4} wrap className="mb-4">
            <Tag color="blue">{selectedType.blockTypes.length} khối</Tag>
            <Tag color="green">{selectedType.relations.length} quan hệ</Tag>
            <Tag color="gold">{selectedType.ruleSets.length} bộ luật</Tag>
          </Space>
        )}

        <Form.Item name="ruleSetIds" label="Bộ luật áp dụng" extra={ruleSetsHint}>
          <Checkbox.Group className="w-full">
            <Space orientation="vertical" size={8} className="w-full">
              {(selectedType?.ruleSets ?? []).map((rs) => (
                <Checkbox key={rs.id} value={rs.id}>
                  <Space size={4} wrap>
                    <span>{rs.icon ?? '⚖️'}</span>
                    <span>{rs.name}</span>
                    <Tag color="gold">{rs.rules.length} luật</Tag>
                  </Space>
                  {rs.description && (
                    <Typography.Paragraph type="secondary" className="!mb-0 text-xs">
                      {rs.description}
                    </Typography.Paragraph>
                  )}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
}
