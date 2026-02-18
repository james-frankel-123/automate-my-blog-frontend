import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Spin, Empty } from 'antd';
import dayjs from 'dayjs';

const MiniCalendarWidget = ({ onDateClick, api }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScheduledPosts = async () => {
      try {
        const result = await api.getPosts();
        // Filter only scheduled posts
        const scheduled = result.posts.filter(
          p => p.scheduledDate && (p.status === 'scheduled' || p.status === 'published')
        );
        setPosts(scheduled);
      } catch (error) {
        console.error('Failed to fetch scheduled posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchScheduledPosts();
  }, [api]);

  const getListData = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    return posts.filter(post => {
      if (!post.scheduledDate) return false;
      const postDate = dayjs(post.scheduledDate).format('YYYY-MM-DD');
      return postDate === dateStr;
    });
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    if (listData.length === 0) return null;

    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {listData.slice(0, 2).map((post, index) => (
          <li key={index} style={{ fontSize: 11 }}>
            <Badge status="success" text="" />
          </li>
        ))}
        {listData.length > 2 && (
          <li style={{ fontSize: 10, color: '#8c8c8c' }}>
            +{listData.length - 2} more
          </li>
        )}
      </ul>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Empty
        description="No scheduled posts"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        style={{ margin: '20px 0' }}
      />
    );
  }

  return (
    <Calendar
      fullscreen={false}
      dateCellRender={dateCellRender}
      onSelect={onDateClick}
      style={{ fontSize: 12 }}
    />
  );
};

export default MiniCalendarWidget;
