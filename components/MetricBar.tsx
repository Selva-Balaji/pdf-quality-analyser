
import React from 'react';
import { Metric } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface MetricBarProps {
  metric: Metric;
}

const MetricBar: React.FC<MetricBarProps> = ({ metric }) => {
  const { theme } = useTheme();
  
  const getBarColor = (score: number) => {
    if (score < 40) return 'bg-red-500';
    if (score < 75) return 'bg-amber-500';
    return 'bg-green-600';
  };

  return (
    <div className="w-full group" title={metric.description}>
      <div className="flex justify-between items-center mb-1">
        <span className={`text-sm font-medium ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        }`}>{metric.name}</span>
        <span className={`text-sm font-bold ${
          theme === 'dark' ? 'text-white' : 'text-black'
        }`}>{Math.round(metric.score)}</span>
      </div>
      <div className={`w-full rounded-full h-2 ${
        theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
      }`}>
        <div
          className={`h-2 rounded-full ${getBarColor(metric.score)} transition-all duration-1000 ease-out`}
          style={{ width: `${Math.max(Math.round(metric.score), 5)}%` }}
        ></div>
      </div>
    </div>
  );
};

export default MetricBar;
