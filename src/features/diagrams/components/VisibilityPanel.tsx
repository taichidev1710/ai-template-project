import { Checkbox, Divider, Empty, Space, Switch, Typography } from 'antd';
import { isDerivedRelation, type BlockType, type DiagramVisibility, type Relation } from '@/domain/diagram';

interface VisibilityPanelProps {
  blockTypes: BlockType[];
  relations: Relation[];
  visibility: DiagramVisibility;
  onChange: (patch: Partial<DiagramVisibility>) => void;
}

/** The "Hiển thị" tab — visibility is first-class state, not a transient view. */
export function VisibilityPanel({ blockTypes, relations, visibility, onChange }: VisibilityPanelProps) {
  const hasDerived = relations.some(isDerivedRelation);

  // The panel lists what is SHOWN, but the model stores what is HIDDEN.
  const shownBlockTypes = blockTypes.filter((b) => !visibility.hiddenBlockTypes.includes(b.id)).map((b) => b.id);
  const shownRelations = relations.filter((r) => !visibility.hiddenRelations.includes(r.id)).map((r) => r.id);

  return (
    <div className="flex flex-col gap-3">
      <Space orientation="vertical" size={8} className="w-full">
        <div className="flex items-center justify-between gap-2">
          <Typography.Text>Quan hệ suy ra</Typography.Text>
          <Switch
            checked={visibility.showDerived}
            disabled={!hasDerived}
            onChange={(v) => onChange({ showDerived: v })}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Typography.Text>Quan hệ phụ</Typography.Text>
          <Switch checked={visibility.showSecondary} onChange={(v) => onChange({ showSecondary: v })} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Typography.Text>Nhãn liên kết</Typography.Text>
          <Switch checked={visibility.edgeLabels} onChange={(v) => onChange({ edgeLabels: v })} />
        </div>
      </Space>

      {!hasDerived && (
        <Typography.Text type="secondary" className="text-xs">
          Loại sơ đồ này chưa khai báo quan hệ suy ra nào.
        </Typography.Text>
      )}

      <Divider className="!my-2" />

      <Typography.Text strong className="text-xs">
        Loại khối
      </Typography.Text>
      {blockTypes.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có loại khối" />
      ) : (
        <Checkbox.Group
          value={shownBlockTypes}
          onChange={(shown) =>
            onChange({ hiddenBlockTypes: blockTypes.filter((b) => !shown.includes(b.id)).map((b) => b.id) })
          }
        >
          <Space orientation="vertical" size={4}>
            {blockTypes.map((b) => (
              <Checkbox key={b.id} value={b.id}>
                <Space size={6}>
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: b.color }}
                    aria-hidden="true"
                  />
                  {b.name}
                </Space>
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      )}

      <Divider className="!my-2" />

      <Typography.Text strong className="text-xs">
        Loại quan hệ
      </Typography.Text>
      {relations.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có quan hệ" />
      ) : (
        <Checkbox.Group
          value={shownRelations}
          onChange={(shown) =>
            onChange({ hiddenRelations: relations.filter((r) => !shown.includes(r.id)).map((r) => r.id) })
          }
        >
          <Space orientation="vertical" size={4}>
            {relations.map((r) => (
              <Checkbox key={r.id} value={r.id}>
                <Space size={6}>
                  <span
                    className="inline-block h-0.5 w-4"
                    style={{ backgroundColor: r.style.color }}
                    aria-hidden="true"
                  />
                  {r.name}
                </Space>
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      )}
    </div>
  );
}
