import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export type TimePeriod = 'today' | 'week' | 'month' | 'last30' | 'year' | 'all';

interface TimePeriodFilterProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  className?: string;
}

const timePeriodOptions = [
  { value: 'today' as TimePeriod, label: 'Today' },
  { value: 'week' as TimePeriod, label: 'Last 7 Days' },
  { value: 'month' as TimePeriod, label: 'This Month' },
  { value: 'last30' as TimePeriod, label: 'Last 30 Days' },
  { value: 'year' as TimePeriod, label: 'This Year' },
  { value: 'all' as TimePeriod, label: 'All Time' },
];

const TimePeriodFilter: React.FC<TimePeriodFilterProps> = ({
  selectedPeriod,
  onPeriodChange,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <select
        value={selectedPeriod}
        onChange={(e) => onPeriodChange(e.target.value as TimePeriod)}
        className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-8 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 cursor-pointer"
      >
        {timePeriodOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Custom dropdown icon */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </div>
      
      {/* Calendar icon */}
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </div>
    </div>
  );
};

export default TimePeriodFilter;
