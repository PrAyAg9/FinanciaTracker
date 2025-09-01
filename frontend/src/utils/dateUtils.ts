import { TimePeriod } from '../components/TimePeriodFilter';

export interface DateRange {
  startDate?: string;
  endDate?: string;
}

export const getDateRangeFromPeriod = (period: TimePeriod): { period?: "week" | "month" | "year" | "all"; startDate?: string; endDate?: string } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'today':
      return {
        startDate: today.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      };

    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 7);
      return {
        startDate: weekStart.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      };

    case 'month':
      return { period: 'month' };

    case 'last30':
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      return {
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      };

    case 'year':
      return { period: 'year' };

    case 'all':
    default:
      return { period: 'all' };
  }
};

export const getPeriodLabel = (period: TimePeriod): string => {
  switch (period) {
    case 'today':
      return 'Today';
    case 'week':
      return 'Last 7 Days';
    case 'month':
      return 'This Month';
    case 'last30':
      return 'Last 30 Days';
    case 'year':
      return 'This Year';
    case 'all':
      return 'All Time';
    default:
      return 'All Time';
  }
};
