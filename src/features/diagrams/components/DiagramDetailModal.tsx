import { Button, Descriptions, Modal, Space, Tag, Typography } from 'antd';
import { EditOutlined, ArrowRightOutlined } from '@ant-design/icons';
import type { DiagramTemplate } from '@/features/diagram-types';
import { formatDate } from '@/shared/lib/utils';
import { DiagramTypeTag } from './DiagramTypeTag';
import type { Diagram } from '../types';

interface DiagramDetailModalProps {
  open: boolean;
  item: Diagram | null;
  types: DiagramTemplate[];
  onOpenCanvas: (item: Diagram) => void;
  onEdit: (item: Diagram) => void;
  onClose: () => void;
}

/** Read-only detail, opened from a row/card "View" action. */
export function DiagramDetailModal({ open, item, types, onOpenCanvas, onEdit, onClose }: DiagramDetailModalProps) {
  const type = item ? types.find((t) => t.id === item.templateId) : undefined;
  // Only the type's own rule sets are applicable, so resolve names through it.
  const appliedSets = type?.ruleSets.filter((rs) => item?.ruleSetIds.includes(rs.id)) ?? [];

  return (
    <Modal
      open={open}
      title="Chi tiết sơ đồ"
      onCancel={onClose}
      destroyOnHidden
      footer={
        item && [
          <Button key="close" onClick={onClose}>
            Huỷ
          </Button>,
          <Button key="edit" icon={<EditOutlined />} onClick={() => onEdit(item)}>
            Sửa
          </Button>,
          <Button key="open" type="primary" icon={<ArrowRightOutlined />} onClick={() => onOpenCanvas(item)}>
            Mở canvas
          </Button>,
        ]
      }
    >
      {item && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Tên">{item.name}</Descriptions.Item>
          <Descriptions.Item label="Loại sơ đồ">
            <DiagramTypeTag type={type} />
          </Descriptions.Item>
          <Descriptions.Item label="Vốn từ vựng">
            {type ? (
              <Space size={4} wrap>
                <Tag color="blue">{type.blockTypes.length} khối</Tag>
                <Tag color="green">{type.relations.length} quan hệ</Tag>
              </Space>
            ) : (
              <Typography.Text type="secondary">—</Typography.Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Nội dung">
            <Space size={4} wrap>
              <Tag color="blue">{item.nodes.length} khối</Tag>
              <Tag color="green">{item.edges.length} liên kết</Tag>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Bộ luật áp dụng">
            {appliedSets.length === 0 ? (
              <Typography.Text type="secondary">Không ràng buộc</Typography.Text>
            ) : (
              <Space orientation="vertical" size={4}>
                {appliedSets.map((rs) => (
                  <Space key={rs.id} size={4}>
                    <span>{rs.icon ?? '⚖️'}</span>
                    <span>{rs.name}</span>
                    <Tag color="gold">{rs.rules.length} luật</Tag>
                  </Space>
                ))}
              </Space>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Tạo lúc">{formatDate(item.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="Cập nhật">{formatDate(item.updatedAt)}</Descriptions.Item>
          <Descriptions.Item label="Mã">{item.id}</Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
