import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FeatureTile from '../FeatureTile';

jest.mock('@ant-design/icons', () => ({
  RiseOutlined: () => <span data-testid="tile-icon">icon</span>,
  CheckCircleOutlined: () => <span data-testid="check-icon">check</span>,
  LinkOutlined: () => <span data-testid="link-icon">link</span>,
}));

describe('FeatureTile', () => {
  const defaultProps = {
    title: 'Find Emerging Topics',
    icon: <span data-testid="tile-icon">icon</span>,
    connected: false,
    summary: 'See what people are searching for.',
    loading: false,
    onConnect: jest.fn(),
    onViewDetails: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and summary', () => {
    render(<FeatureTile {...defaultProps} />);
    expect(screen.getByText('Find Emerging Topics')).toBeInTheDocument();
    expect(screen.getByText('See what people are searching for.')).toBeInTheDocument();
  });

  it('shows Connect button when not connected', () => {
    render(<FeatureTile {...defaultProps} />);
    const connectBtn = screen.getByRole('button', { name: /connect/i });
    expect(connectBtn).toBeInTheDocument();
    fireEvent.click(connectBtn);
    expect(defaultProps.onConnect).toHaveBeenCalledTimes(1);
  });

  it('shows View Details link when connected', () => {
    render(<FeatureTile {...defaultProps} connected summary="Connected summary" />);
    expect(screen.getByText('Connected summary')).toBeInTheDocument();
    const viewDetails = screen.getByText(/View Details/);
    expect(viewDetails).toBeInTheDocument();
    fireEvent.click(viewDetails);
    expect(defaultProps.onViewDetails).toHaveBeenCalledTimes(1);
  });

  it('shows loading state and hides Connect button when loading is true', () => {
    render(<FeatureTile {...defaultProps} loading />);
    expect(screen.getByText('Find Emerging Topics')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /connect/i })).not.toBeInTheDocument();
  });

  it('renders as connected when connected is true', () => {
    render(<FeatureTile {...defaultProps} connected summary="Connected summary" />);
    expect(screen.getByText('View Details →')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /connect/i })).not.toBeInTheDocument();
  });

  it('renders as disconnected when connected is false', () => {
    render(<FeatureTile {...defaultProps} />);
    expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
    expect(screen.queryByText('View Details →')).not.toBeInTheDocument();
  });

  it('uses fallback summary when not connected and no summary', () => {
    render(<FeatureTile {...defaultProps} summary="" />);
    expect(screen.getByText('Connect to view insights and analytics')).toBeInTheDocument();
  });

  it('uses fallback when connected and empty summary', () => {
    render(<FeatureTile {...defaultProps} connected summary="" />);
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });
});
