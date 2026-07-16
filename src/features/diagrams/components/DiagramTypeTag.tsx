import { Space, Typography } from 'antd';
import type { DiagramTemplate } from '@/features/diagram-types';

interface DiagramTypeTagProps {
  type?: DiagramTemplate;
}

/**
 * Shows a diagram's Loại sơ đồ. The type may be missing — a diagram outlives the
 * type it points at if that type is deleted — so say so rather than render blank.
 */
export function DiagramTypeTag({ type }: DiagramTypeTagProps) {
  if (!type) {
    return (
      <Typography.Text type="secondary" italic>
        Loại đã bị xoá
      </Typography.Text>
    );
  }

  return (
    <Space size={4}>
      <span>{type.icon ?? '📊'}</span>
      <span>{type.name}</span>
    </Space>
  );
}
