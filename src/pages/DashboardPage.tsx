import { Card, Col, Row, Statistic } from 'antd';
import { ArrowUpOutlined, TeamOutlined, ShoppingOutlined, DollarOutlined } from '@ant-design/icons';
import { PageContainer } from '@/shared/ui';
import { useTranslation } from 'react-i18next';

/** Example dashboard page — replace stats/charts with real data hooks. */
export function DashboardPage() {
  const { t } = useTranslation();
  return (
    <PageContainer title={t('nav.dashboard')}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Users" value={1128} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Orders" value={93} prefix={<ShoppingOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Revenue" value={11280} prefix={<DollarOutlined />} precision={0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Growth" value={11.28} suffix="%" prefix={<ArrowUpOutlined />} valueStyle={{ color: 'var(--app-color-success)' }} />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
}
