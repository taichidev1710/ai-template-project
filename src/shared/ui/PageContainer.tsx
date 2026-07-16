import type { ReactNode } from 'react';
import { Typography } from 'antd';

interface PageContainerProps {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
}

/** Standard page wrapper: consistent title row + surface card. */
export function PageContainer({ title, extra, children }: PageContainerProps) {
  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <Typography.Title level={3} className="!mb-0">
          {title}
        </Typography.Title>
        {extra}
      </div>
      <div className="rounded-app bg-surface p-6">{children}</div>
    </div>
  );
}
