import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Tabs, Spin, Alert } from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';
import autoBlogAPI from '../../services/api';
import FunnelVisualization from './Analytics/FunnelVisualization';
import CohortRetentionChart from './Analytics/CohortRetentionChart';
import UserJourneyTimeline from './Analytics/UserJourneyTimeline';
import RevenueSectionPanel from './Analytics/RevenueSectionPanel';
import FunnelSectionPanel from './Analytics/FunnelSectionPanel';
import ProductSectionPanel from './Analytics/ProductSectionPanel';
import UsageMetricsPanel from './Analytics/UsageMetricsPanel';
import SessionHeatmap from './Analytics/SessionHeatmap';

const { RangePicker } = DatePicker;

const UserAnalyticsTab = () => {
  const { isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);

  const [platformMetrics, setPlatformMetrics] = useState(null);
  const [funnelData, setFunnelData] = useState(null);
  const [leadFunnelData, setLeadFunnelData] = useState(null);
  const [cohortData, setCohortData] = useState(null);
  const [llmInsights, setLLMInsights] = useState(null);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      const [metrics, funnel, leadFunnel, cohorts, insights] = await Promise.all([
        autoBlogAPI.getComprehensiveMetrics('30d').catch(err => {
          console.error('Failed to load comprehensive metrics:', err);
          return null;
        }),
        autoBlogAPI.getFunnelData(startDate, endDate).catch(err => {
          console.error('Failed to load funnel data:', err);
          return null;
        }),
        autoBlogAPI.getLeadFunnelData(startDate, endDate).catch(err => {
          console.error('Failed to load lead funnel data:', err);
          return null;
        }),
        autoBlogAPI.getCohortAnalysis(startDate, endDate, 'week').catch(err => {
          console.error('Failed to load cohort data:', err);
          return null;
        }),
        autoBlogAPI.getAnalyticsInsights('comprehensive', '30d').catch(err => {
          console.error('Failed to load insights:', err);
          return { insights: [], error: err.message };
        })
      ]);

      setPlatformMetrics(metrics);
      setFunnelData(funnel);
      setLeadFunnelData(leadFunnel);
      setCohortData(cohorts);
      setLLMInsights(insights);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadAnalytics();
    }
  }, [dateRange, isSuperAdmin]);

  // Access control - moved after hooks to comply with React Hooks rules
  if (!isSuperAdmin) {
    return (
      <Alert
        message="Access Denied"
        description="You must be a superadmin to view analytics."
        type="error"
        showIcon
      />
    );
  }

  return (
    <div className="user-analytics-tab" style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <h2 style={{ margin: 0 }}>Product Analytics Dashboard</h2>
              </Col>
              <Col>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  format="YYYY-MM-DD"
                  allowClear={false}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" tip="Loading analytics data..." />
        </div>
      ) : (
        <>
          {/* KPI Cards - Primary Metrics */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Users"
                  value={platformMetrics?.total_users || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Active Paying Users"
                  value={platformMetrics?.total_paying_users || 0}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: 'var(--color-primary)' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="30-Day Total Revenue"
                  value={platformMetrics?.total_revenue || 0}
                  prefix="$"
                  precision={2}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="User Growth Rate"
                  value={platformMetrics?.user_growth_rate || 0}
                  suffix="%"
                  prefix={
                    (platformMetrics?.user_growth_rate || 0) >= 0 ?
                      <RiseOutlined /> :
                      <FallOutlined />
                  }
                  valueStyle={{
                    color: (platformMetrics?.user_growth_rate || 0) >= 0 ? '#3f8600' : '#cf1322'
                  }}
                />
              </Card>
            </Col>
          </Row>

          {/* KPI Cards - Subscription & Revenue Breakdown */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Subscription MRR"
                  value={platformMetrics?.subscription_mrr || 0}
                  prefix="$"
                  precision={2}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Pay-Per-Use Revenue"
                  value={platformMetrics?.pay_per_use_revenue || 0}
                  prefix="$"
                  precision={2}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Starter Plans"
                  value={platformMetrics?.starter_count || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Professional Plans"
                  value={platformMetrics?.professional_count || 0}
                  valueStyle={{ color: 'var(--color-primary)' }}
                />
              </Card>
            </Col>
          </Row>

          {/* KPI Cards - Referrals & Activity */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Referrals"
                  value={platformMetrics?.total_referrals || 0}
                  valueStyle={{ color: '#13c2c2' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Referral Conversion Rate"
                  value={platformMetrics?.referral_conversion_rate || 0}
                  suffix="%"
                  precision={1}
                  valueStyle={{ color: '#eb2f96' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Referral Posts Used"
                  value={`${platformMetrics?.referral_posts_used || 0}/${platformMetrics?.referral_posts_granted || 0}`}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Active Users (30d)"
                  value={platformMetrics?.active_users || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Three-Section Analytics Insights */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={24}>
              <RevenueSectionPanel
                revenueData={llmInsights?.sections?.revenue}
                loading={loading}
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={24}>
              <FunnelSectionPanel
                funnelData={llmInsights?.sections?.funnel}
                funnelVisualizationData={funnelData}
                leadFunnelData={leadFunnelData}
                dateRange={dateRange}
                loading={loading}
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={24}>
              <ProductSectionPanel
                productData={llmInsights?.sections?.product}
                platformMetrics={platformMetrics}
                loading={loading}
              />
            </Col>
          </Row>

          {/* Usage Metrics Panel */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={24}>
              <UsageMetricsPanel />
            </Col>
          </Row>

          {/* Tabbed Analytics Views */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Card>
                <Tabs defaultActiveKey="funnel">
                  <Tabs.TabPane tab="Conversion Funnel" key="funnel">
                    <FunnelVisualization data={funnelData} />
                  </Tabs.TabPane>

                  <Tabs.TabPane tab="Cohort Analysis" key="cohorts">
                    <CohortRetentionChart data={cohortData} />
                  </Tabs.TabPane>

                  <Tabs.TabPane tab="User Journeys" key="journeys">
                    <UserJourneyTimeline dateRange={dateRange} />
                  </Tabs.TabPane>

                  <Tabs.TabPane tab="Session Analytics" key="sessions">
                    <SessionHeatmap dateRange={dateRange} />
                  </Tabs.TabPane>
                </Tabs>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default UserAnalyticsTab;
