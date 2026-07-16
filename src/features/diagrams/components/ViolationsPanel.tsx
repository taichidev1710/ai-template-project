import { Empty, Result, Tag, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import type { Violation } from '@/domain/diagram';

interface ViolationsPanelProps {
  violations: Violation[];
  hasRules: boolean;
  onSelect: (v: Violation) => void;
}

const RULE_LABELS: Record<Violation['ruleType'], string> = {
  require: 'bắt buộc',
  limit: 'giới hạn',
  ends: 'đầu nối',
  chain: 'chuỗi tầng',
  same: 'cùng loại',
};

/** The "Vi phạm" tab — live output of the rule engine. */
export function ViolationsPanel({ violations, hasRules, onSelect }: ViolationsPanelProps) {
  if (!hasRules) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Sơ đồ này không áp bộ luật nào — vẽ tự do, không ràng buộc."
      />
    );
  }

  if (violations.length === 0) {
    return (
      <Result
        icon={<CheckCircleOutlined />}
        status="success"
        title="Không có vi phạm"
        subTitle="Sơ đồ đang thoả mọi luật đã áp."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {violations.map((v) => (
        // Clicking a row centres the offending element on the canvas.
        <button
          key={`${v.ruleId}_${v.id}`}
          type="button"
          onClick={() => onSelect(v)}
          className="flex w-full cursor-pointer flex-col items-start gap-1 rounded-app bg-canvas px-3 py-2 text-left"
        >
          <span>
            <Tag color="red">{RULE_LABELS[v.ruleType]}</Tag>
            <Typography.Text className="text-xs">{v.kind === 'node' ? 'Khối' : 'Liên kết'}</Typography.Text>
          </span>
          <Typography.Text className="text-xs">{v.message}</Typography.Text>
        </button>
      ))}
    </div>
  );
}
