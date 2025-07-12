
import React from 'react';
import { Metric } from '../types';

interface MetricBarProps {
  metric: Metric;
}

const MetricBar: React.FC<MetricBarProps> = ({ metric }) => {
  const getBarColor = (score: number) => {
    if (score < 40) return 'bg-red-500';
    if (score < 75) return 'bg-yellow-400';
    return 'bg-green-400';
  };

  return (
    <div className="w-full group" title={metric.description}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-300">{metric.name}</span>
        <span className="text-sm font-bold text-brand-text">{Math.round(metric.score)}/100</span>
      </div>
      <div className="w-full bg-brand-lighter rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${getBarColor(metric.score)} transition-all duration-1000 ease-out`}
          style={{ width: `${Math.max(Math.round(metric.score), 5)}%` }}
        ></div>
      </div>
    </div>
  );
};

export default MetricBar;
