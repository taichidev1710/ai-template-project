import { ColorPicker, Form, Input, Modal, Select, theme } from 'antd';
import type { AggregationColor } from 'antd/es/color-picker/color';
import { useEffect } from 'react';
import { BlockGlyph } from './BlockGlyph';
import { SHAPE_OPTIONS } from '../types';
import type { BlockType, BlockTypeInput } from '../types';

interface BlockTypeFormModalProps {
  open: boolean;
  initialValue?: BlockType | null;
  confirmLoading?: boolean;
  onSubmit: (values: BlockTypeInput) => void;
  onCancel: () => void;
}

const DEFAULTS: BlockTypeInput = { name: '', shape: 'ellipse', color: '#5fb99a' };

/** Create/edit modal. Controlled by the page; no data fetching inside. */
export function BlockTypeFormModal({ open, initialValue, confirmLoading, onSubmit, onCancel }: BlockTypeFormModalProps) {
  const [form] = Form.useForm<BlockTypeInput>();
  const isEdit = Boolean(initialValue);
  const { token } = theme.useToken();

  // Every shape drawn next to its name, the demo's pill-grid idea in a Select.
  const shapeOptions = SHAPE_OPTIONS.map((o) => ({
    value: o.value,
    label: (
      <span className="flex items-center gap-2">
        <BlockGlyph shape={o.value} color={token.colorTextSecondary} size={18} />
        {o.label}
      </span>
    ),
  }));

  useEffect(() => {
    if (open) form.setFieldsValue(initialValue ?? DEFAULTS);
  }, [open, initialValue, form]);

  return (
    <Modal
      open={open}
      title={isEdit ? 'Sửa loại khối' : 'Thêm loại khối'}
      okText="Lưu"
      cancelText="Huỷ"
      confirmLoading={confirmLoading}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form<BlockTypeInput> form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
        <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Nhập tên loại khối' }]}>
          <Input placeholder="VD: Người, Phòng ban, Bước…" />
        </Form.Item>
        <Form.Item name="shape" label="Hình" rules={[{ required: true }]}>
          <Select options={shapeOptions} />
        </Form.Item>
        <Form.Item
          name="color"
          label="Màu"
          rules={[{ required: true }]}
          getValueFromEvent={(color: AggregationColor) => color.toHexString()}
        >
          <ColorPicker format="hex" showText />
        </Form.Item>
      </Form>
    </Modal>
  );
}
