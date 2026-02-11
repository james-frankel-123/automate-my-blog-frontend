import React, { useState, useEffect } from 'react';
import { Card, Tabs, Spin, DatePicker, Alert } from 'antd';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import autoBlogAPI from '../../../services/api';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const UsageMetricsPanel = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('clicks-over-time');
  const [dateRange, setDateRange] = useState(null);
  const [error, setError] = useState(null);

  const [clicksData, setClicksData] = useState([]);
  const [actionsData, setActionsData] = useState([]);
  const [activeUsersData, setActiveUsersData] = useState([]);
  const [clicksByPageData, setClicksByPageData] = useState([]);

  useEffect(() => {
    loadUsageMetrics();
  }, [dateRange]);

  const loadUsageMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      // Default to last 30 days if no date range selected
      const startDate = dateRange ? dateRange[0].toDate() : new Date(Date.now() - 30*24*60*60*1000);
      const endDate = dateRange ? dateRange[1].toDate() : new Date();

      const [clicks, actions, activeUsers, clicksByPage] = await Promise.all([
        autoBlogAPI.getClicksOverTime(startDate, endDate, 'day').catch(err => {
          console.error('Failed to load clicks:', err);
          return { data: [] };
        }),
        autoBlogAPI.getActionsOverTime(startDate, endDate, 'hour').catch(err => {
          console.error('Failed to load actions:', err);
          return { data: [] };
        }),
        autoBlogAPI.getActiveUsersOverTime(startDate, endDate, 'day').catch(err => {
          console.error('Failed to load active users:', err);
          return { data: [] };
        }),
        autoBlogAPI.getClicksByPage(startDate, endDate).catch(err => {
          console.error('Failed to load clicks by page:', err);
          return { data: [] };
        })
      ]);

      setClicksData(clicks.data || []);
      setActionsData(actions.data || []);
      setActiveUsersData(activeUsers.data || []);
      setClicksByPageData(clicksByPage.data || []);
    } catch (error) {
      console.error('Failed to load usage metrics:', error);
      setError('Failed to load usage metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Usage Metrics" style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <RangePicker
          value={dateRange}
          onChange={setDateRange}
          style={{ width: '100%' }}
          placeholder={['Start Date', 'End Date']}
        />
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          closable
          style={{ marginBottom: 16 }}
          onClose={() => setError(null)}
        />
      )}

      <Spin spinning={loading}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Clicks Over Time" key="clicks-over-time">
            {clicksData.length === 0 ? (
              <Alert
                message="No data available"
                description="No click data found for the selected time range."
                type="info"
                showIcon
              />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={clicksData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"
                    tickFormatter={(value) => {
                      try {
                        return format(new Date(value), 'MMM d');
                      } catch {
                        return value;
                      }
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => {
                      try {
                        return format(new Date(value), 'MMM d, yyyy');
                      } catch {
                        return value;
                      }
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="click_count" stroke="#8884d8" name="Total Clicks" />
                  <Line type="monotone" dataKey="unique_users" stroke="#82ca9d" name="Unique Users" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </TabPane>

          <TabPane tab="Actions Over Time" key="actions-over-time">
            {actionsData.length === 0 ? (
              <Alert
                message="No data available"
                description="No action data found for the selected time range."
                type="info"
                showIcon
              />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={actionsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"
                    tickFormatter={(value) => {
                      try {
                        return format(new Date(value), 'MMM d');
                      } catch {
                        return value;
                      }
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => {
                      try {
                        return format(new Date(value), 'MMM d, yyyy HH:mm');
                      } catch {
                        return value;
                      }
                    }}
                  />
                  <Legend />
                  <Bar dataKey="action_count" fill="#8884d8" name="Actions" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabPane>

          <TabPane tab="Active Users Over Time" key="active-users">
            {activeUsersData.length === 0 ? (
              <Alert
                message="No data available"
                description="No active user data found for the selected time range."
                type="info"
                showIcon
              />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={activeUsersData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"
                    tickFormatter={(value) => {
                      try {
                        return format(new Date(value), 'MMM d');
                      } catch {
                        return value;
                      }
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => {
                      try {
                        return format(new Date(value), 'MMM d, yyyy');
                      } catch {
                        return value;
                      }
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="active_users" stackId="1" stroke="#8884d8" fill="#8884d8" name="Total Active" />
                  <Area type="monotone" dataKey="active_paying_users" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Paying" />
                  <Area type="monotone" dataKey="active_free_users" stackId="1" stroke="#ffc658" fill="#ffc658" name="Free" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </TabPane>

          <TabPane tab="Clicks by Page" key="clicks-by-page">
            {clicksByPageData.length === 0 ? (
              <Alert
                message="No data available"
                description="No page-level click data found for the selected time range."
                type="info"
                showIcon
              />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={clicksByPageData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="page_url"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="click_count" fill="#8884d8" name="Clicks" />
                  <Bar dataKey="unique_users" fill="#82ca9d" name="Unique Users" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabPane>
        </Tabs>
      </Spin>
    </Card>
  );
};

export default UsageMetricsPanel;
