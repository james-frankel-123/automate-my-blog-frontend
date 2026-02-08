import React, { useState, useEffect } from 'react';
import { Card, Select, Timeline, Alert, Spin, Empty } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import autoBlogAPI from '../../../services/api';

const { Option } = Select;

const UserJourneyTimeline = ({ dateRange }) => {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [journeyData, setJourneyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  // Load available users
  useEffect(() => {
    loadUsers();
  }, []);

  // Load journey when user is selected
  useEffect(() => {
    if (selectedUserId) {
      loadUserJourney(selectedUserId);
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    try {
      const response = await autoBlogAPI.getActiveUsers();
      setUsers(response?.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    }
  };

  const loadUserJourney = async (userId) => {
    try {
      setLoading(true);
      const response = await autoBlogAPI.getUserJourney(userId, 100);
      setJourneyData(response);
    } catch (error) {
      console.error('Failed to load user journey:', error);
      setJourneyData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="User Journey Timeline"
      extra={
        <Select
          style={{ width: 200 }}
          placeholder="Select a user"
          onChange={setSelectedUserId}
          value={selectedUserId}
        >
          {users.map(user => (
            <Option key={user.id} value={user.id}>
              {user.email}
            </Option>
          ))}
        </Select>
      }
    >
      {!selectedUserId ? (
        <Alert
          message="Select a user to view their journey"
          description="Choose a user from the dropdown above to see their activity timeline."
          type="info"
          showIcon
        />
      ) : loading ? (
        <Spin tip="Loading user journey..." />
      ) : journeyData && journeyData.events && journeyData.events.length > 0 ? (
        <Timeline>
          {journeyData.events.map((event, index) => (
            <Timeline.Item
              key={event.id || index}
              dot={<ClockCircleOutlined />}
              color={event.conversion_funnel_step ? 'green' : 'blue'}
            >
              <p><strong>{event.event_type}</strong></p>
              {event.conversion_funnel_step && (
                <p style={{ color: 'var(--color-success)' }}>Funnel: {event.conversion_funnel_step}</p>
              )}
              {event.page_url && (
                <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>Page: {event.page_url}</p>
              )}
              <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                {new Date(event.timestamp).toLocaleString()}
              </p>
            </Timeline.Item>
          ))}
        </Timeline>
      ) : (
        <Empty description="No journey data available for this user" />
      )}
    </Card>
  );
};

export default UserJourneyTimeline;
