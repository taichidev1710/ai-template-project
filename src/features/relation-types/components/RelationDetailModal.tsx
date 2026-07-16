import { Button, Descriptions, Modal, Tag } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { isDerivedRelation } from '@/domain/diagram';
import { RelationLinePreview } from './RelationLinePreview';
import { describePattern, roleLabel } from '../types';
import type { Relation } from '../types';

interface RelationDetailModalProps {
  open: boolean;
  item: Relation | null;
  onEdit: (item: Relation) => void;
  onClose: () => void;
  relationName?: (id: string) => string;
}

export function RelationDetailModal({ open, item, onEdit, onClose, relationName }: RelationDetailModalProps) {
  return (
    <Modal
      open={open}
      title="Chi tiết quan hệ"
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
          <Descriptions.Item label="Kiểu đường">
            <RelationLinePreview style={item.style} width={100} />
          </Descriptions.Item>
          <Descriptions.Item label="Tên">{item.name}</Descriptions.Item>
          <Descriptions.Item label="Loại">
            {isDerivedRelation(item) ? <Tag color="purple">Suy ra</Tag> : <Tag color="blue">Nền</Tag>}
          </Descriptions.Item>
          {isDerivedRelation(item) ? (
            <>
              <Descriptions.Item label="Đường đi">{describePattern(item.pattern, relationName ?? ((id) => id))}</Descriptions.Item>
              <Descriptions.Item label="Loại trừ">
                {(item.exclude ?? []).length ? item.exclude!.join(', ') : '— (chỉ trừ chính nó)'}
              </Descriptions.Item>
            </>
          ) : (
            <Descriptions.Item label="Vai trò">{roleLabel(item.role)}</Descriptions.Item>
          )}
          <Descriptions.Item label="Mã">{item.id}</Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
