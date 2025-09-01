import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Loader } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import TimePeriodFilter, { TimePeriod } from '../TimePeriodFilter';
import { getDateRangeFromPeriod, getPeriodLabel } from '../../utils/dateUtils';

interface SummaryCardProps {
  title: string;
  amount: string;
  icon: React.ReactNode;
  iconColor: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, icon, iconColor, trend }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{amount}</p>
          {trend && (
            <div className="flex items-center mt-2">
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trend.value}
              </span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const SummaryCards: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all'); // Changed default to 'all'

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const filters = getDateRangeFromPeriod(timePeriod);
        const data = await analyticsService.getSummary(filters);
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        // Fallback to default values
        setAnalytics({
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          trends: {
            income: { value: '0%', isPositive: true },
            expenses: { value: '0%', isPositive: false },
            balance: { value: '0%', isPositive: true }
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timePeriod]); // Added timePeriod as dependency

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Financial Overview
          </h2>
          <div className="w-48 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const summaryData = [
    {
      title: 'Total Income',
      amount: `$${analytics?.totalIncome?.toFixed(2) || '0.00'}`,
      icon: <TrendingUp className="w-6 h-6 text-white" />,
      iconColor: 'bg-green-500',
      trend: analytics?.incomeChange ? { 
        value: analytics.incomeChange, 
        isPositive: !analytics.incomeChange.startsWith('-') 
      } : { value: '0%', isPositive: true }
    },
    {
      title: 'Total Expenses',
      amount: `$${analytics?.totalExpenses?.toFixed(2) || '0.00'}`,
      icon: <TrendingDown className="w-6 h-6 text-white" />,
      iconColor: 'bg-red-500',
      trend: analytics?.expenseChange ? { 
        value: analytics.expenseChange, 
        isPositive: analytics.expenseChange.startsWith('-')
      } : { value: '0%', isPositive: false }
    },
    {
      title: 'Net Income',
      amount: `$${analytics?.netIncome?.toFixed(2) || '0.00'}`,
      icon: <DollarSign className="w-6 h-6 text-white" />,
      iconColor: 'bg-blue-500',
      trend: { 
        value: analytics?.netIncome >= 0 ? '+' + ((analytics?.netIncome || 0) / (analytics?.totalIncome || 1) * 100).toFixed(1) + '%' : '0%', 
        isPositive: (analytics?.netIncome || 0) >= 0 
      }
    }
  ];

  return (
    <div className="space-y-4">
      {/* Time Period Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Financial Overview
        </h2>
        <TimePeriodFilter
          selectedPeriod={timePeriod}
          onPeriodChange={setTimePeriod}
          className="w-48"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryData.map((item, index) => (
          <SummaryCard
            key={index}
            title={item.title}
            amount={item.amount}
            icon={item.icon}
            iconColor={item.iconColor}
            trend={item.trend}
          />
        ))}
      </div>
    </div>
  );
};

export default SummaryCards;