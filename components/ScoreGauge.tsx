
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ScoreGaugeProps {
  score: number;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score }) => {
  const { theme } = useTheme();
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s < 40) return 'text-red-500';
    if (s < 75) return 'text-amber-500';
    return 'text-green-600';
  };

  const getTrackColor = (s: number) => {
    if (s < 40) return '#EF4444'; // red-500
    if (s < 75) return '#F59E0B'; // amber-500
    return '#16A34A'; // green-600
  };

  const getScoreLabel = (s: number) => {
    if (s >= 90) return 'Excellent';
    if (s >= 75) return 'Good';
    if (s >= 60) return 'Fair';
    if (s >= 40) return 'Poor';
    return 'Very Poor';
  };

  return (
    <div className="relative my-6 flex items-center justify-center">
      <svg className="transform -rotate-90" width="140" height="140" viewBox="0 0 120 120">
        <circle
          className={theme === 'dark' ? 'text-gray-600' : 'text-gray-200'}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
        <circle
          stroke={getTrackColor(score)}
          strokeWidth="8"
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 0.8s ease-out',
          }}
        />
      </svg>
      <div className={`absolute flex flex-col items-center justify-center ${getScoreColor(score)}`}>
        <span className="text-5xl font-bold">
          {Math.round(score)}
        </span>
        <span className={`text-base font-semibold tracking-wider ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>{getScoreLabel(score)}</span>
      </div>
    </div>
  );
};

export default ScoreGauge;
