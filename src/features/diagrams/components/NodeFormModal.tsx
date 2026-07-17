import { useEffect } from 'react';
import { Button, Form, Input, Modal, Select, Switch, Tooltip } from 'antd';
import { NodeIndexOutlined, PlusOutlined } from '@ant-design/icons';
import type { BlockType, DiagramNode } from '@/domain/diagram';

export interface NodeFormValues {
  label: string;
  blockTypeId: string;
  exempt: boolean;
  notes?: string;
}

interface NodeFormModalProps {
  open: boolean;
  node: DiagramNode | null;
  blockTypes: BlockType[];
  /** Arm link mode with this node already picked as the source. */
  onLink: (values: NodeFormValues) => void;
  /** Create a child block already joined by the primary relation. */
  onAddChild: (values: NodeFormValues) => void;
  /** Why "Thêm con" is unavailable, if it is. */
  addChildBlocked?: string | null;
  onSubmit: (values: NodeFormValues) => void;
  onCancel: () => void;
}

/** Edit one node, and start the two things you usually want next from it. */
export function NodeFormModal({
  open,
  node,
  blockTypes,
  onLink,
  onAddChild,
  addChildBlocked,
  onSubmit,
  onCancel,
}: NodeFormModalProps) {
  const [form] = Form.useForm<NodeFormValues>();

  useEffect(() => {
    if (open && node) {
      form.setFieldsValue({
        label: node.label,
        blockTypeId: node.blockTypeId,
        exempt: Boolean(node.exempt),
        notes: node.notes ?? '',
      });
    }
  }, [open, node, form]);

  /**
   * Both actions leave this modal, so save what is typed first — otherwise
   * renaming a block and then reaching for "Thêm con" would throw the rename
   * away, and nothing would say so.
   */
  const saveThen = (after: (values: NodeFormValues) => void) => async () => {
    try {
      after(await form.validateFields());
    } catch {
      /* invalid form — the fields show why, so stay put */
    }
  };

  return (
    <Modal
      open={open}
      title="Chi tiết khối"
      onCancel={onCancel}
      destroyOnHidden
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Tooltip title="Lưu rồi chạm khối ĐÍCH trên canvas để nối">
              <Button icon={<NodeIndexOutlined />} onClick={saveThen(onLink)}>
                Nối khối
              </Button>
            </Tooltip>
            <Tooltip title={addChildBlocked ?? 'Tạo khối mới, nối sẵn bằng quan hệ chính'}>
              {/* A disabled AntD Button swallows pointer events, so the tooltip
                  needs a wrapper to explain WHY it is off. */}
              <span>
                <Button
                  icon={<PlusOutlined />}
                  disabled={Boolean(addChildBlocked)}
                  onClick={saveThen(onAddChild)}
                >
                  Thêm con
                </Button>
              </span>
            </Tooltip>
          </div>
          <div className="flex gap-2">
            <Button onClick={onCancel}>Huỷ</Button>
            <Button type="primary" onClick={() => form.submit()}>
              Lưu
            </Button>
          </div>
        </div>
      }
    >
      <Form<NodeFormValues> form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
        <Form.Item name="label" label="Tên" rules={[{ required: true, message: 'Nhập tên khối' }]}>
          <Input placeholder="VD: Nguyễn Văn A" />
        </Form.Item>
        <Form.Item name="blockTypeId" label="Loại khối" rules={[{ required: true, message: 'Chọn loại khối' }]}>
          <Select options={blockTypes.map((b) => ({ value: b.id, label: b.name }))} />
        </Form.Item>
        <Form.Item
          name="exempt"
          label="Miễn luật bắt buộc"
          valuePropName="checked"
          extra="Khối chưa xác định: bỏ qua các luật “bắt buộc”, nhưng vẫn chịu luật giới hạn/đầu nối."
        >
          <Switch />
        </Form.Item>
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
