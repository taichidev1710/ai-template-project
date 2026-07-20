import { useEffect, useState } from 'react';
import { App, Button, ColorPicker, Form, Input, Modal, Select, Switch, Tooltip, Upload, theme } from 'antd';
import type { AggregationColor } from 'antd/es/color-picker/color';
import { CloseOutlined, NodeIndexOutlined, PictureOutlined, PlusOutlined } from '@ant-design/icons';
import type { BlockType, DiagramNode, NodeShape } from '@/domain/diagram';
import { BlockGlyph, SHAPE_OPTIONS } from '@/features/block-types';

export interface NodeFormValues {
  label: string;
  blockTypeId: string;
  exempt: boolean;
  notes?: string;
  /** `inherit` = follow the block type's shape. */
  shape: NodeShape | 'inherit';
  /** `null` = follow the block type's colour. */
  color?: string | null;
  /** Data-URL; `null` = no image. */
  image?: string | null;
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

/** Photos land in the mock store as data-URLs; keep them phone-photo-proof. */
const MAX_IMAGE_BYTES = 1024 * 1024;

/**
 * Edit one node, and start the two things you usually want next from it.
 * Shape/colour/image override the block type per node (the demo's freedom);
 * anything left "theo loại khối" keeps following the type.
 */
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
  const { message } = App.useApp();
  const { token } = theme.useToken();
  // The preview lives OUTSIDE the form: with `destroyOnHidden`, watching form
  // state from up here trips antd's unconnected-form warning (see memory note).
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (open && node) {
      form.setFieldsValue({
        label: node.label,
        blockTypeId: node.blockTypeId,
        exempt: Boolean(node.exempt),
        notes: node.notes ?? '',
        shape: node.shape ?? 'inherit',
        color: node.color ?? null,
        image: node.image ?? null,
      });
      setImagePreview(node.image ?? null);
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

  const shapeOptions = [
    { value: 'inherit' as const, label: <span>Theo loại khối</span> },
    ...SHAPE_OPTIONS.map((o) => ({
      value: o.value,
      label: (
        <span className="flex items-center gap-2">
          <BlockGlyph shape={o.value} color={token.colorTextSecondary} size={18} />
          {o.label}
        </span>
      ),
    })),
  ];

  const pickImage = (file: File): false => {
    if (file.size > MAX_IMAGE_BYTES) {
      message.warning('Ảnh quá lớn (trên 1MB) — chọn ảnh nhỏ hơn.');
      return false;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      form.setFieldValue('image', url);
      setImagePreview(url);
    };
    reader.readAsDataURL(file);
    return false; // never actually upload — the mock store keeps the data-URL
  };

  const clearImage = () => {
    form.setFieldValue('image', null);
    setImagePreview(null);
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

        <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
          <Form.Item name="shape" label="Hình riêng">
            <Select options={shapeOptions} />
          </Form.Item>
          <Form.Item
            name="color"
            label="Màu riêng"
            extra="Nút xoá trong bảng màu = theo màu loại khối."
            getValueFromEvent={(c: AggregationColor | null) => (c ? c.toHexString() : null)}
          >
            <ColorPicker format="hex" showText allowClear onClear={() => form.setFieldValue('color', null)} />
          </Form.Item>
        </div>

        {/* The data-URL rides a hidden field; Upload only feeds it. */}
        <Form.Item name="image" hidden>
          <Input />
        </Form.Item>
        <Form.Item label="Ảnh trong khối" extra="Ảnh phủ kín nền khối trên canvas (như demo). Tối đa 1MB.">
          <div className="flex items-center gap-3">
            <Upload accept="image/*" maxCount={1} showUploadList={false} beforeUpload={pickImage}>
              <Button icon={<PictureOutlined />}>{imagePreview ? 'Đổi ảnh…' : 'Chọn ảnh…'}</Button>
            </Upload>
            {imagePreview && (
              <>
                <img src={imagePreview} alt="Ảnh của khối" className="h-12 w-12 rounded-app object-cover" />
                <Button size="small" type="text" icon={<CloseOutlined />} onClick={clearImage}>
                  Bỏ ảnh
                </Button>
              </>
            )}
          </div>
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
