import React from 'react';
import { render, screen } from '@testing-library/react';
import StrategyDetailsView from '../StrategyDetailsView';

jest.mock('../../../services/api');

const mockContentCalendarSection = jest.fn(({ strategyId, strategyName }) => (
  <div data-testid="content-calendar-section">
    <span data-testid="calendar-strategy-id">{strategyId}</span>
    <span data-testid="calendar-strategy-name">{strategyName}</span>
  </div>
));
jest.mock('../ContentCalendarSection', () => ({
  __esModule: true,
  default: function MockContentCalendarSection(props) {
    return mockContentCalendarSection(props);
  }
}));

jest.mock('../../Modals/PaymentModal', () => ({
  PaymentModal: ({ visible }) =>
    visible ? <div data-testid="payment-modal">Payment Modal</div> : null
}));

const defaultStrategy = {
  id: 'strat-1',
  pitch: 'Test pitch',
  customerProblem: 'Test problem',
  contentIdeas: null,
  hasContentCalendar: false
};

function renderStrategyDetailsView(props = {}) {
  return render(
    <StrategyDetailsView
      strategy={defaultStrategy}
      visible={true}
      onBack={() => {}}
      {...props}
    />
  );
}

describe('StrategyDetailsView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ pitch: 'Pitch text', pricing: 'Pricing text' })
      })
    );
  });

  describe('7-day content calendar integration', () => {
    it('renders ContentCalendarSection when strategy has contentIdeas', () => {
      const strategyWithContent = {
        ...defaultStrategy,
        contentIdeas: [{ title: 'Day 1', body: 'Idea 1' }]
      };
      renderStrategyDetailsView({ strategy: strategyWithContent });

      expect(mockContentCalendarSection).toHaveBeenCalledWith(
        expect.objectContaining({
          strategyId: 'strat-1',
          strategyName: 'Test pitch'
        })
      );
    });

    it('renders ContentCalendarSection when strategy has hasContentCalendar true', () => {
      const strategyWithCalendar = {
        ...defaultStrategy,
        contentIdeas: [],
        hasContentCalendar: true
      };
      renderStrategyDetailsView({ strategy: strategyWithCalendar });

      expect(mockContentCalendarSection).toHaveBeenCalledWith(
        expect.objectContaining({
          strategyId: 'strat-1',
          strategyName: 'Test pitch'
        })
      );
    });

    it('renders ContentCalendarTimeline (teaser) when strategy has no content calendar', () => {
      renderStrategyDetailsView();

      expect(mockContentCalendarSection).not.toHaveBeenCalled();
      expect(screen.getByText('7-Day Content Calendar')).toBeInTheDocument();
      expect(screen.getByText(/Subscribe to unlock full calendar/)).toBeInTheDocument();
    });

    it('uses customerProblem as strategyName when pitch is empty', () => {
      const strategyWithContent = {
        ...defaultStrategy,
        pitch: '',
        customerProblem: 'Fallback name',
        contentIdeas: [{ title: 'Day 1' }]
      };
      renderStrategyDetailsView({ strategy: strategyWithContent });

      expect(mockContentCalendarSection).toHaveBeenCalledWith(
        expect.objectContaining({
          strategyId: 'strat-1',
          strategyName: 'Fallback name'
        })
      );
    });
  });
});
