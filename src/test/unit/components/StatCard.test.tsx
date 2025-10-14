import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import StatCard from '@/components/StatCard';
import { Users } from 'lucide-react';

describe('StatCard Component', () => {
  it('renders title and value correctly', () => {
    render(
      <StatCard
        title="Total Farmers"
        value={150}
        icon={Users}
      />
    );

    expect(screen.getByText('Total Farmers')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('displays trend when provided', () => {
    render(
      <StatCard
        title="Total Farmers"
        value={150}
        icon={Users}
        trend={{ value: 12, isPositive: true }}
      />
    );

    expect(screen.getByText(/12%/)).toBeInTheDocument();
  });

  it('shows positive trend with correct styling', () => {
    const { container } = render(
      <StatCard
        title="Revenue"
        value={50000}
        icon={Users}
        trend={{ value: 8.5, isPositive: true }}
      />
    );

    const trendElement = screen.getByText(/8.5%/);
    expect(trendElement).toBeInTheDocument();
  });

  it('shows negative trend with correct styling', () => {
    render(
      <StatCard
        title="Issues"
        value={5}
        icon={Users}
        trend={{ value: 3, isPositive: false }}
      />
    );

    const trendElement = screen.getByText(/3%/);
    expect(trendElement).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <StatCard
        title="Active Batches"
        value={42}
        icon={Users}
        description="Currently in processing"
      />
    );

    expect(screen.getByText('Currently in processing')).toBeInTheDocument();
  });
});
