import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import MiniCalendarWidget from '../MiniCalendarWidget';

jest.mock('antd', () => ({
  Calendar: () => <div data-testid="ant-calendar">Calendar</div>,
  Badge: () => <span data-testid="ant-badge">Badge</span>,
  Spin: () => <div data-testid="ant-spin">Loading</div>,
  Empty: ({ description }) => <div data-testid="ant-empty">{description}</div>,
}));

describe('MiniCalendarWidget', () => {
  const mockApi = {
    getPosts: jest.fn().mockResolvedValue({ posts: [] }),
  };

  const mockOnDateClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.getPosts.mockResolvedValue({ posts: [] });
  });

  it('shows empty state when no scheduled posts', async () => {
    render(<MiniCalendarWidget onDateClick={mockOnDateClick} api={mockApi} />);
    await waitFor(() => {
      expect(mockApi.getPosts).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText('No scheduled posts')).toBeInTheDocument();
    });
  });

  it('renders calendar when there are scheduled posts', async () => {
    const scheduledDate = dayjs().format('YYYY-MM-DD');
    mockApi.getPosts.mockResolvedValue({
      posts: [
        {
          id: '1',
          title: 'Scheduled Post',
          status: 'scheduled',
          scheduledDate,
        },
      ],
    });
    render(<MiniCalendarWidget onDateClick={mockOnDateClick} api={mockApi} />);
    await waitFor(() => {
      expect(mockApi.getPosts).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.queryByText('No scheduled posts')).not.toBeInTheDocument();
    });
  });

  it('fetches posts on mount', async () => {
    render(<MiniCalendarWidget onDateClick={mockOnDateClick} api={mockApi} />);
    await waitFor(() => {
      expect(mockApi.getPosts).toHaveBeenCalled();
    });
  });

  it('filters only scheduled or published posts with scheduledDate', async () => {
    mockApi.getPosts.mockResolvedValue({
      posts: [
        { id: '1', status: 'scheduled', scheduledDate: dayjs().format('YYYY-MM-DD') },
        { id: '2', status: 'draft' },
        { id: '3', status: 'published', scheduledDate: dayjs().add(1, 'day').format('YYYY-MM-DD') },
      ],
    });
    render(<MiniCalendarWidget onDateClick={mockOnDateClick} api={mockApi} />);
    await waitFor(() => {
      expect(mockApi.getPosts).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.queryByText('No scheduled posts')).not.toBeInTheDocument();
    });
  });
});
