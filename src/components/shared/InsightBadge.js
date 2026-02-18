import React from 'react';
import { Tag, Tooltip } from 'antd';
import {
  RiseOutlined,
  SearchOutlined,
  FireOutlined,
  BulbOutlined,
  TeamOutlined
} from '@ant-design/icons';

/**
 * Reusable badge component showing why content is recommended
 * Based on Google Trends, Search Console, or Analytics data
 *
 * @param {string} reason - Type of recommendation (trending, search_opportunity, high_converting, content_gap, audience_match)
 * @param {string} detail - Detailed explanation (shown in tooltip)
 * @param {string} impact - Impact level (high, medium, low)
 * @param {ReactNode} icon - Optional custom icon
 */
export default function InsightBadge({ reason, detail, impact, icon }) {
  const impactColors = {
    high: 'red',
    medium: 'orange',
    low: 'blue'
  };

  const reasonIcons = {
    trending: <RiseOutlined />,
    search_opportunity: <SearchOutlined />,
    high_converting: <FireOutlined />,
    content_gap: <BulbOutlined />,
    audience_match: <TeamOutlined />
  };

  const reasonLabels = {
    trending: 'Trending Now',
    search_opportunity: 'Search Opportunity',
    high_converting: 'High Converting',
    content_gap: 'Content Gap',
    audience_match: 'Audience Match'
  };

  const selectedIcon = icon || reasonIcons[reason] || <BulbOutlined />;
  const selectedColor = impact ? impactColors[impact] : 'blue';
  const selectedLabel = reasonLabels[reason] || 'Recommended';

  return (
    <Tooltip title={detail} placement="top">
      <Tag
        icon={selectedIcon}
        color={selectedColor}
        style={{
          cursor: 'help',
          fontWeight: 500,
          fontSize: '12px'
        }}
      >
        {selectedLabel}
      </Tag>
    </Tooltip>
  );
}
