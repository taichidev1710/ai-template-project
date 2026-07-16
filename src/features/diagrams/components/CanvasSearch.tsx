import { useMemo, useState } from 'react';
import { AutoComplete, Input, Space, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { BlockType, DiagramNode } from '@/domain/diagram';
import { searchNodes } from '../canvas/search';

interface CanvasSearchProps {
  nodes: DiagramNode[];
  blockTypes: BlockType[];
  /** Centre the canvas on the picked node and select it. */
  onPick: (nodeId: string) => void;
}

/**
 * Quick-find floating over the canvas (the demo's `qfSearch`). Matching ignores
 * Vietnamese accents, so "vo" finds "Vợ".
 */
export function CanvasSearch({ nodes, blockTypes, onPick }: CanvasSearchProps) {
  const [query, setQuery] = useState('');

  const options = useMemo(() => {
    const byType = new Map(blockTypes.map((b) => [b.id, b]));
    return searchNodes(nodes, query).map((m) => {
      const type = byType.get(m.blockTypeId);
      return {
        value: m.id,
        label: (
          <Space size={6}>
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: type?.color ?? '#9aa1b3' }}
              aria-hidden="true"
            />
            <span>{m.label}</span>
            <Typography.Text type="secondary" className="text-xs">
              {type?.name ?? ''}
            </Typography.Text>
          </Space>
        ),
      };
    });
  }, [nodes, blockTypes, query]);

  return (
    <AutoComplete
      value={query}
      options={options}
      onSearch={setQuery}
      onSelect={(nodeId: string) => {
        onPick(nodeId);
        setQuery('');
      }}
      // The value is a node id, not the text — don't echo the id into the box.
      onChange={(v: string) => setQuery(options.some((o) => o.value === v) ? '' : v)}
      className="w-full sm:w-64"
      notFoundContent={query.trim() ? <Typography.Text type="secondary" className="text-xs">Không thấy khối nào</Typography.Text> : null}
    >
      <Input allowClear prefix={<SearchOutlined />} placeholder="Tìm khối theo tên…" />
    </AutoComplete>
  );
}
