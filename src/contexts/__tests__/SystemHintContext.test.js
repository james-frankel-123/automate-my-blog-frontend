/**
 * SystemHintContext — one consistent slot for hints (Issue 5)
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SystemHintProvider, useSystemHint } from '../SystemHintContext';
import SystemHint from '../../components/Dashboard/SystemHint';

function TestConsumer() {
  const { hint, setHint, clearHint } = useSystemHint();
  return (
    <div>
      <span data-testid="hint-message">{hint?.message ?? 'none'}</span>
      <button type="button" onClick={() => setHint('Test hint', 'success', 0)}>Set hint</button>
      <button type="button" onClick={clearHint}>Clear</button>
      <SystemHint />
    </div>
  );
}

describe('SystemHintContext', () => {
  it('provides hint state and setHint/clearHint', () => {
    render(
      <SystemHintProvider>
        <TestConsumer />
      </SystemHintProvider>
    );
    expect(screen.getByTestId('hint-message')).toHaveTextContent('none');
    act(() => {
      screen.getByText('Set hint').click();
    });
    expect(screen.getByTestId('hint-message')).toHaveTextContent('Test hint');
    act(() => {
      screen.getByText('Clear').click();
    });
    expect(screen.getByTestId('hint-message')).toHaveTextContent('none');
  });

  it('SystemHint shows message and has dismiss button', () => {
    render(
      <SystemHintProvider>
        <TestConsumer />
      </SystemHintProvider>
    );
    act(() => {
      screen.getByText('Set hint').click();
    });
    expect(screen.getByTestId('system-hint')).toBeInTheDocument();
    expect(screen.getByTestId('system-hint')).toHaveTextContent('Test hint');
    expect(screen.getByRole('button', { name: /dismiss hint/i })).toBeInTheDocument();
  });

  it('useSystemHint returns no-op when outside provider', () => {
    function Orphan() {
      const { hint, setHint } = useSystemHint();
      return (
        <div>
          <span data-testid="orphan-message">{hint?.message ?? 'none'}</span>
          <button type="button" onClick={() => setHint('Should not show')}>Set</button>
        </div>
      );
    }
    render(<Orphan />);
    expect(screen.getByTestId('orphan-message')).toHaveTextContent('none');
    act(() => {
      screen.getByText('Set').click();
    });
    expect(screen.getByTestId('orphan-message')).toHaveTextContent('none');
  });
});
