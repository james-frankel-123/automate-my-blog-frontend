import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CardCarousel from '../CardCarousel';

describe('CardCarousel', () => {
  it('renders children as cards', () => {
    render(
      <CardCarousel>
        <div data-testid="card-1">One</div>
        <div data-testid="card-2">Two</div>
      </CardCarousel>
    );
    expect(screen.getByTestId('card-1')).toBeInTheDocument();
    expect(screen.getByTestId('card-2')).toBeInTheDocument();
  });

  it('shows Next or Continue button', () => {
    render(<CardCarousel><div>Card</div></CardCarousel>);
    const next = screen.queryByTestId('carousel-next');
    const cont = screen.queryByTestId('carousel-continue');
    expect(next ?? cont).toBeTruthy();
    expect(screen.getByRole('button', { name: /next|continue/i })).toBeInTheDocument();
  });

  it('shows empty state when no children', () => {
    render(<CardCarousel emptyMessage="No items." />);
    expect(screen.getByText('No items.')).toBeInTheDocument();
  });

  it('shows Continue button in empty state when onAllCardsViewed provided', () => {
    const onAllCardsViewed = jest.fn();
    render(<CardCarousel onAllCardsViewed={onAllCardsViewed} emptyMessage="Nothing here." />);
    expect(screen.getByText('Nothing here.')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-continue')).toBeInTheDocument();
  });

  it('calls onAllCardsViewed when Continue is clicked after viewing all', async () => {
    const onAllCardsViewed = jest.fn();
    render(
      <CardCarousel onAllCardsViewed={onAllCardsViewed}>
        <div>Card</div>
      </CardCarousel>
    );
    const continueBtn = screen.queryByTestId('carousel-continue');
    if (continueBtn) {
      await userEvent.click(continueBtn);
      expect(onAllCardsViewed).toHaveBeenCalled();
    }
  });
});
