import { Button, Dropdown, Select, Space, Tooltip } from 'antd';
import {
  PlusOutlined,
  SaveOutlined,
  DeleteOutlined,
  NodeIndexOutlined,
  ExpandOutlined,
  ShrinkOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import type { BlockType, DiagramNode } from '@/domain/diagram';
import { CanvasSearch } from './CanvasSearch';

interface CanvasToolbarProps {
  blockTypes: BlockType[];
  nodes: DiagramNode[];
  addBlockTypeId: string | undefined;
  /** Link mode is armed; the relation is chosen later, in the modal. */
  linking: boolean;
  linkSourceId: string | null;
  selectedId: string | null;
  /** Whether the selected node has a primary-relation subtree to fold. */
  canCollapse: boolean;
  isCollapsed: boolean;
  dirty: boolean;
  saving: boolean;
  onAddBlockTypeChange: (id: string) => void;
  onToggleLinking: () => void;
  onAddNode: () => void;
  onDeleteSelected: () => void;
  onToggleCollapse: () => void;
  onFindNode: (nodeId: string) => void;
  onFit: () => void;
  onSave: () => void;
  /** Replace the canvas with generated data that satisfies the applied rules. */
  onFillSample: () => void;
  /** Replace the canvas with BIG data for a performance run — rules not obeyed. */
  onFillStress: (count: number) => void;
}

/** Sizes offered under "Dữ liệu mẫu" — the demo's stress tool went to 20 000. */
const STRESS_SIZES = [1000, 5000, 20000];

/** Toolbar for the canvas: add blocks, draw links, delete, fit, save. */
export function CanvasToolbar({
  blockTypes,
  nodes,
  addBlockTypeId,
  linking,
  linkSourceId,
  selectedId,
  canCollapse,
  isCollapsed,
  dirty,
  saving,
  onAddBlockTypeChange,
  onToggleLinking,
  onAddNode,
  onDeleteSelected,
  onToggleCollapse,
  onFindNode,
  onFit,
  onSave,
  onFillSample,
  onFillStress,
}: CanvasToolbarProps) {
  const linkHint = !linking
    ? 'Bật chế độ nối, rồi chạm khối nguồn và khối đích'
    : linkSourceId
      ? 'Chạm khối ĐÍCH để nối. Chạm nền để huỷ.'
      : 'Chạm khối NGUỒN. Chạm nền để huỷ.';

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <Space wrap size={8}>
        <Space.Compact>
          <Select
            value={addBlockTypeId}
            onChange={onAddBlockTypeChange}
            placeholder="Loại khối"
            className="w-32 sm:w-40"
            options={blockTypes.map((b) => ({ value: b.id, label: b.name }))}
          />
          <Button icon={<PlusOutlined />} onClick={onAddNode} disabled={!addBlockTypeId}>
            Thêm khối
          </Button>
        </Space.Compact>

        <Tooltip title={linkHint}>
          <Button type={linking ? 'primary' : 'default'} icon={<NodeIndexOutlined />} onClick={onToggleLinking}>
            {linking ? 'Đang nối…' : 'Nối khối'}
          </Button>
        </Tooltip>

        <Tooltip title="Gấp/mở nhánh con theo quan hệ chính (chỉ ẩn hiển thị, không xoá dữ liệu)">
          <Button icon={<ShrinkOutlined />} onClick={onToggleCollapse} disabled={!canCollapse}>
            {isCollapsed ? 'Mở nhánh' : 'Thu gọn nhánh'}
          </Button>
        </Tooltip>

        <Button danger icon={<DeleteOutlined />} onClick={onDeleteSelected} disabled={!selectedId}>
          Xoá
        </Button>

        <Tooltip title="Dựng khối và liên kết mẫu thoả mọi luật đang áp. Mục xổ xuống tạo dữ liệu LỚN để thử hiệu năng — không theo luật.">
          <Dropdown.Button
            onClick={onFillSample}
            menu={{
              items: STRESS_SIZES.map((n) => ({
                key: String(n),
                label: `Dữ liệu lớn: ${n.toLocaleString('vi-VN')} khối`,
              })),
              onClick: ({ key }) => onFillStress(Number(key)),
            }}
          >
            <ExperimentOutlined /> Dữ liệu mẫu
          </Dropdown.Button>
        </Tooltip>
      </Space>

      <Space wrap size={8}>
        <CanvasSearch nodes={nodes} blockTypes={blockTypes} onPick={onFindNode} />
        <Button icon={<ExpandOutlined />} onClick={onFit}>
          Vừa khung
        </Button>
        <Button type="primary" icon={<SaveOutlined />} onClick={onSave} loading={saving} disabled={!dirty}>
          {dirty ? 'Lưu' : 'Đã lưu'}
        </Button>
      </Space>
    </div>
  );
}
