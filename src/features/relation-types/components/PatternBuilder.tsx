import { Button, Space, Tag, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { PathStep } from '../types';

interface PatternBuilderProps {
  value?: PathStep[];
  onChange?: (value: PathStep[]) => void;
}

/**
 * Declares a derived relation as a sequence of up/down hops over the base
 * relation. Controlled input (bound via a Form.Item). e.g. ↑↑ = ông bà,
 * ↑↓ = anh chị em, ↓↓ = cháu, ↑↑↓ = cô/chú.
 */
export function PatternBuilder({ value = [], onChange }: PatternBuilderProps) {
  const add = (step: PathStep) => onChange?.([...value, step]);
  const pop = () => onChange?.(value.slice(0, -1));

  return (
    <div>
      <div className="mb-2 flex min-h-[32px] flex-wrap items-center gap-1 rounded-app bg-canvas px-2 py-1">
        {value.length === 0 ? (
          <Typography.Text type="secondary" className="text-xs">
            Chưa có bước nào — thêm ↑/↓
          </Typography.Text>
        ) : (
          value.map((s, i) => (
            <Tag key={i} color={s === 'up' ? 'geekblue' : 'volcano'}>
              {s === 'up' ? '↑ Lên' : '↓ Xuống'}
            </Tag>
          ))
        )}
      </div>
      <Space wrap>
        <Button size="small" icon={<ArrowUpOutlined />} onClick={() => add('up')}>
          Lên
        </Button>
        <Button size="small" icon={<ArrowDownOutlined />} onClick={() => add('down')}>
          Xuống
        </Button>
        <Button size="small" onClick={pop} disabled={value.length === 0}>
          Xoá bước cuối
        </Button>
      </Space>
      <div className="mt-1">
        <Typography.Text type="secondary" className="text-xs">
          VD: ↑↑ = ông bà · ↑↓ = anh chị em · ↓↓ = cháu · ↑↑↓ = cô/dì/chú/bác
        </Typography.Text>
      </div>
    </div>
  );
}
