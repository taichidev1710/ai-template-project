import { Button, Descriptions, Modal, Space, Tag } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { BlockGlyph } from './BlockGlyph';
import { shapeLabel } from '../types';
import type { BlockType } from '../types';

interface BlockTypeDetailModalProps {
  open: boolean;
  item: BlockType | null;
  onEdit: (item: BlockType) => void;
  onClose: () => void;
}

/** Read-only detail, opened from a row/card "View" action. */
export function BlockTypeDetailModal({ open, item, onEdit, onClose }: BlockTypeDetailModalProps) {
  return (
    <Modal
      open={open}
      title="Chi tiết loại khối"
      onCancel={onClose}
      destroyOnHidden
      footer={
        item && [
          <Button key="close" onClick={onClose}>
            Huỷ
          </Button>,
          <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => onEdit(item)}>
            Sửa
          </Button>,
        ]
      }
    >
      {item && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Xem trước">
            <Space>
              <BlockGlyph shape={item.shape} color={item.color} size={32} />
              {item.name}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Tên">{item.name}</Descriptions.Item>
          <Descriptions.Item label="Hình">{shapeLabel(item.shape)}</Descriptions.Item>
          <Descriptions.Item label="Màu">
            <Tag color={item.color}>{item.color}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Mã">{item.id}</Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
