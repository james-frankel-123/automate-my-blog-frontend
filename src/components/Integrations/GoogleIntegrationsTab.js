import React, { useState } from 'react';
import { Card, Typography, Button, Alert, Space, Input, message, Tabs, Divider } from 'antd';
import { GoogleOutlined, LinkOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

/**
 * GoogleIntegrationsTab - Manage Google API integrations
 * Similar to Voice Adaptation tab, accessible from user menu
 */
export default function GoogleIntegrationsTab() {
  const [activeIntegration, setActiveIntegration] = useState('trends');

  // Integration states
  const [trendsConnected, setTrendsConnected] = useState(false);
  const [searchConsoleConnected, setSearchConsoleConnected] = useState(false);
  const [analyticsConnected, setAnalyticsConnected] = useState(false);

  // API key inputs
  const [trendsApiKey, setTrendsApiKey] = useState('');
  const [searchConsoleCredentials, setSearchConsoleCredentials] = useState('');
  const [analyticsCredentials, setAnalyticsCredentials] = useState('');

  const handleConnectTrends = async () => {
    if (!trendsApiKey.trim()) {
      message.error('Please enter your Google Trends API key');
      return;
    }

    try {
      // TODO: Call backend to save API key
      message.success('Google Trends connected successfully!');
      setTrendsConnected(true);
    } catch (error) {
      message.error('Failed to connect Google Trends');
    }
  };

  const handleConnectSearchConsole = async () => {
    if (!searchConsoleCredentials.trim()) {
      message.error('Please enter your Google Search Console credentials');
      return;
    }

    try {
      // TODO: Call backend to save credentials
      message.success('Google Search Console connected successfully!');
      setSearchConsoleConnected(true);
    } catch (error) {
      message.error('Failed to connect Google Search Console');
    }
  };

  const handleConnectAnalytics = async () => {
    if (!analyticsCredentials.trim()) {
      message.error('Please enter your Google Analytics credentials');
      return;
    }

    try {
      // TODO: Call backend to save credentials
      message.success('Google Analytics connected successfully!');
      setAnalyticsConnected(true);
    } catch (error) {
      message.error('Failed to connect Google Analytics');
    }
  };

  const renderTrendsTab = () => (
    <div>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>
              <GoogleOutlined /> Google Trends
            </Title>
            <Paragraph>
              Connect Google Trends to get predictive search intelligence for your content strategy.
              Identify rising search queries and trending topics before your competitors.
            </Paragraph>
          </div>

          {trendsConnected ? (
            <Alert
              message="Connected"
              description="Google Trends is successfully connected and ready to provide search intelligence."
              type="success"
              icon={<CheckCircleOutlined />}
              showIcon
              action={
                <Button size="small" danger onClick={() => setTrendsConnected(false)}>
                  Disconnect
                </Button>
              }
            />
          ) : (
            <>
              <Alert
                message="Not Connected"
                description="Connect your Google Trends API to unlock predictive search intelligence."
                type="warning"
                icon={<WarningOutlined />}
                showIcon
              />

              <div>
                <Text strong>API Key</Text>
                <Paragraph type="secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
                  Get your API key from the Google Cloud Console. Enable the Google Trends API and create an API key.
                </Paragraph>
                <Input.Password
                  placeholder="Enter your Google Trends API key"
                  value={trendsApiKey}
                  onChange={(e) => setTrendsApiKey(e.target.value)}
                  style={{ marginBottom: '12px' }}
                />
                <Button
                  type="primary"
                  icon={<LinkOutlined />}
                  onClick={handleConnectTrends}
                >
                  Connect Google Trends
                </Button>
              </div>

              <Divider />

              <div>
                <Text strong>What You'll Get:</Text>
                <ul style={{ marginTop: '8px' }}>
                  <li>Rising search queries in your niche</li>
                  <li>Related topics and trending keywords</li>
                  <li>Interest over time for specific keywords</li>
                  <li>Predictive content recommendations</li>
                </ul>
              </div>
            </>
          )}
        </Space>
      </Card>
    </div>
  );

  const renderSearchConsoleTab = () => (
    <div>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>
              <GoogleOutlined /> Google Search Console
            </Title>
            <Paragraph>
              Connect Google Search Console to track your content's SEO performance and ranking.
              See which keywords drive traffic and how your content performs in search results.
            </Paragraph>
          </div>

          {searchConsoleConnected ? (
            <Alert
              message="Connected"
              description="Google Search Console is connected. Your SEO data is being tracked."
              type="success"
              icon={<CheckCircleOutlined />}
              showIcon
              action={
                <Button size="small" danger onClick={() => setSearchConsoleConnected(false)}>
                  Disconnect
                </Button>
              }
            />
          ) : (
            <>
              <Alert
                message="Not Connected"
                description="Connect Google Search Console to track your SEO performance."
                type="warning"
                icon={<WarningOutlined />}
                showIcon
              />

              <div>
                <Text strong>Service Account Credentials (JSON)</Text>
                <Paragraph type="secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
                  Create a service account in Google Cloud Console, grant it Search Console permissions,
                  and paste the JSON credentials here.
                </Paragraph>
                <TextArea
                  placeholder='{"type": "service_account", "project_id": "...", ...}'
                  value={searchConsoleCredentials}
                  onChange={(e) => setSearchConsoleCredentials(e.target.value)}
                  rows={6}
                  style={{ marginBottom: '12px', fontFamily: 'monospace', fontSize: '11px' }}
                />
                <Button
                  type="primary"
                  icon={<LinkOutlined />}
                  onClick={handleConnectSearchConsole}
                >
                  Connect Search Console
                </Button>
              </div>

              <Divider />

              <div>
                <Text strong>What You'll Get:</Text>
                <ul style={{ marginTop: '8px' }}>
                  <li>Top performing search queries</li>
                  <li>Click-through rates and impressions</li>
                  <li>Average position for your keywords</li>
                  <li>Page-level performance tracking</li>
                </ul>
              </div>
            </>
          )}
        </Space>
      </Card>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>
              <GoogleOutlined /> Google Analytics
            </Title>
            <Paragraph>
              Connect Google Analytics to track traffic, engagement, and conversions from your content.
              Measure ROI and see which strategies deliver the best results.
            </Paragraph>
          </div>

          {analyticsConnected ? (
            <Alert
              message="Connected"
              description="Google Analytics is tracking your content performance and ROI."
              type="success"
              icon={<CheckCircleOutlined />}
              showIcon
              action={
                <Button size="small" danger onClick={() => setAnalyticsConnected(false)}>
                  Disconnect
                </Button>
              }
            />
          ) : (
            <>
              <Alert
                message="Not Connected"
                description="Connect Google Analytics to track content ROI and performance."
                type="warning"
                icon={<WarningOutlined />}
                showIcon
              />

              <div>
                <Text strong>Service Account Credentials (JSON)</Text>
                <Paragraph type="secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
                  Create a service account in Google Cloud Console with Analytics Viewer role,
                  and paste the JSON credentials here.
                </Paragraph>
                <TextArea
                  placeholder='{"type": "service_account", "project_id": "...", ...}'
                  value={analyticsCredentials}
                  onChange={(e) => setAnalyticsCredentials(e.target.value)}
                  rows={6}
                  style={{ marginBottom: '12px', fontFamily: 'monospace', fontSize: '11px' }}
                />
                <Button
                  type="primary"
                  icon={<LinkOutlined />}
                  onClick={handleConnectAnalytics}
                >
                  Connect Analytics
                </Button>
              </div>

              <Divider />

              <div>
                <Text strong>What You'll Get:</Text>
                <ul style={{ marginTop: '8px' }}>
                  <li>Pageviews and engagement metrics</li>
                  <li>Traffic sources breakdown</li>
                  <li>Conversion tracking for your content</li>
                  <li>ROI measurement and optimization insights</li>
                  <li>Comparison of trend-informed vs standard content</li>
                </ul>
              </div>
            </>
          )}
        </Space>
      </Card>
    </div>
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Google Integrations</Title>
        <Paragraph>
          Connect your Google services to unlock powerful search intelligence, SEO tracking,
          and ROI measurement for your content strategy.
        </Paragraph>
      </div>

      <Tabs
        activeKey={activeIntegration}
        onChange={setActiveIntegration}
        size="large"
      >
        <TabPane
          tab={
            <span>
              <GoogleOutlined />
              Google Trends {trendsConnected && <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: '8px' }} />}
            </span>
          }
          key="trends"
        >
          {renderTrendsTab()}
        </TabPane>

        <TabPane
          tab={
            <span>
              <GoogleOutlined />
              Search Console {searchConsoleConnected && <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: '8px' }} />}
            </span>
          }
          key="search-console"
        >
          {renderSearchConsoleTab()}
        </TabPane>

        <TabPane
          tab={
            <span>
              <GoogleOutlined />
              Analytics {analyticsConnected && <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: '8px' }} />}
            </span>
          }
          key="analytics"
        >
          {renderAnalyticsTab()}
        </TabPane>
      </Tabs>
    </div>
  );
}
