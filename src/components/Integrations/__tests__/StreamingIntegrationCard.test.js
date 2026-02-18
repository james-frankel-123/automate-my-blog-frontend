import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StreamingIntegrationCard from '../StreamingIntegrationCard';

describe('StreamingIntegrationCard', () => {
  const defaultProps = {
    service: 'trends',
    title: 'Google Trends',
    isConnected: false,
    onConnect: jest.fn(),
    onDisconnect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    delete window.EventSource;
  });

  it('renders title and Connect button when not connected', async () => {
    localStorage.setItem('accessToken', 'mock-token');
    window.EventSource = jest.fn().mockImplementation(() => ({
      onmessage: null,
      onerror: null,
      close: jest.fn(),
    }));

    render(<StreamingIntegrationCard {...defaultProps} />);

    expect(screen.getByText('Google Trends')).toBeInTheDocument();
    const connectBtn = screen.getByRole('button', { name: /Connect Now|Loading/i });
    expect(connectBtn).toBeInTheDocument();
  });

  it('when connected shows Integration Active and Disconnect button', () => {
    render(<StreamingIntegrationCard {...defaultProps} isConnected />);

    expect(screen.getByText('Integration Active')).toBeInTheDocument();
    expect(screen.getByText('This integration is connected and tracking data.')).toBeInTheDocument();
    const disconnectBtn = screen.getByRole('button', { name: /Disconnect/i });
    expect(disconnectBtn).toBeInTheDocument();
  });

  it('calls onDisconnect when Disconnect is clicked', () => {
    const onDisconnect = jest.fn();
    render(<StreamingIntegrationCard {...defaultProps} isConnected onDisconnect={onDisconnect} />);

    fireEvent.click(screen.getByRole('button', { name: /Disconnect/i }));
    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });

  it('calls onConnect when Connect Now is clicked', async () => {
    localStorage.setItem('accessToken', 'mock-token');
    const closeMock = jest.fn();
    window.EventSource = jest.fn().mockImplementation(() => ({
      onmessage: null,
      onerror: null,
      close: closeMock,
    }));

    render(<StreamingIntegrationCard {...defaultProps} />);

    await screen.findByRole('button', { name: /Connect Now/i });
    const connectBtn = screen.getByRole('button', { name: /Connect Now/i });
    fireEvent.click(connectBtn);
    expect(defaultProps.onConnect).toHaveBeenCalledTimes(1);
  });

  it('shows Connected label when isConnected', () => {
    render(<StreamingIntegrationCard {...defaultProps} isConnected />);
    expect(screen.getByText(/Connected/)).toBeInTheDocument();
  });
});
