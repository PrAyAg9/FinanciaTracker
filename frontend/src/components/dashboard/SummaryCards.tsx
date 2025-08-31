import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Loader } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{amount}</p>
          {trend && (
            <div className="flex items-center mt-2">
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
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

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await analyticsService.getSummary({ period: 'month' });
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
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          </div>
        ))}
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
  );
};

export default SummaryCards;