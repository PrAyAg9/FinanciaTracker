import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Loader } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';

const SpendingChart: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryData = async () => {
        try {
            setLoading(true);
            const response = await analyticsService.getCategories({ 
                period: 'month',
                type: 'expense'
            });
            
            const categoryData = response.categories || [];
            
            if (categoryData.length > 0) {
                // 1. Aggregate all totals, grouping null/empty categories into a single 'Other'
                const aggregatedTotals = categoryData.reduce((accumulator: { [key: string]: number }, currentItem: any) => {
                    const categoryName = currentItem._id || 'Other';
                    accumulator[categoryName] = (accumulator[categoryName] || 0) + currentItem.total;
                    return accumulator;
                }, {});

                // 2. Convert the aggregated object back into an array
                const aggregatedArray = Object.entries(aggregatedTotals).map(([name, total]) => ({
                    name,
                    total
                }));

                // 3. Calculate the grand total from the clean, aggregated data
                const grandTotal = aggregatedArray.reduce((sum: number, cat: any) => sum + cat.total, 0);
                
                // 4. Transform the aggregated data for the pie chart
                const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#EC4899', '#14B8A6'];
                const transformedData = aggregatedArray.map((item: any, index: number) => ({
                    name: item.name,
                    value: grandTotal > 0 ? Math.round((item.total / grandTotal) * 100) : 0,
                    color: colors[index % colors.length],
                    amount: item.total
                }));

                setData(transformedData.filter((item: any) => item.value > 0));
            } else {
                // Fallback sample data when no real data exists
                setData([
                    { name: 'Food & Dining', value: 35, color: '#3B82F6', amount: 350 },
                    { name: 'Transportation', value: 25, color: '#EF4444', amount: 250 },
                    { name: 'Bills & Utilities', value: 20, color: '#10B981', amount: 200 },
                    { name: 'Entertainment', value: 15, color: '#F59E0B', amount: 150 },
                    { name: 'Shopping', value: 5, color: '#8B5CF6', amount: 50 }
                ]);
            }
        } catch (err) {
            console.error('Error fetching category data:', err);
            // Fallback to sample data on error
            setData([
                { name: 'Food & Dining', value: 35, color: '#3B82F6', amount: 350 },
                { name: 'Transportation', value: 25, color: '#EF4444', amount: 250 },
                { name: 'Bills & Utilities', value: 20, color: '#10B981', amount: 200 },
                { name: 'Entertainment', value: 15, color: '#F59E0B', amount: 150 },
                { name: 'Shopping', value: 5, color: '#8B5CF6', amount: 50 }
            ]);
        } finally {
            setLoading(false);
        }
    };

    fetchCategoryData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Spending by Category</h3>
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Spending by Category</h3>
        <div className="flex items-center justify-center py-12 text-gray-500">
          No spending data available
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0];
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium text-gray-900">{dataPoint.name}</p>
          <p className="text-blue-600">${dataPoint.payload.amount?.toFixed(2)} ({dataPoint.value}%)</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't render label for very small slices

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Spending by Category</h3>
      <p className="text-gray-600 text-sm mb-6">Current month breakdown</p>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={100}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
              strokeWidth={2}
              stroke="#ffffff"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-6">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2 overflow-hidden">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-700 truncate">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpendingChart;