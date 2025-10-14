import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import StatusBadge from '@/components/StatusBadge';

describe('StatusBadge Component', () => {
  it('renders active status correctly', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('renders pending status correctly', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('renders completed status correctly', () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('renders cancelled status correctly', () => {
    render(<StatusBadge status="cancelled" />);
    expect(screen.getByText('cancelled')).toBeInTheDocument();
  });

  it('applies correct variant for active status', () => {
    const { container } = render(<StatusBadge status="active" />);
    const badge = container.querySelector('.badge');
    expect(badge).toHaveClass('bg-green-500');
  });

  it('applies correct variant for pending status', () => {
    const { container } = render(<StatusBadge status="pending" />);
    const badge = container.querySelector('.badge');
    expect(badge).toHaveClass('bg-yellow-500');
  });
});
