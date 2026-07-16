import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import type { Profile, ProfileFieldDef } from '../types';

interface ProfileInfoListProps {
  profile: Profile;
  fields: ProfileFieldDef[];
  column?: number;
}

/**
 * Renders declarative field defs as an AntD Descriptions block. Because it
 * consumes `ProfileFieldDef[]`, the same component renders the base fields,
 * the tier-specific fields, or any subset a consumer passes.
 */
export function ProfileInfoList({ profile, fields, column = 2 }: ProfileInfoListProps) {
  const { t } = useTranslation();
  return (
    <Descriptions
      column={column}
      size="small"
      items={fields.map((f) => ({
        key: f.id,
        label: t(f.label),
        span: f.span,
        children: f.render(profile),
      }))}
    />
  );
}
