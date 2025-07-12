
import React from 'react';

interface ScoreGaugeProps {
  score: number;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s < 40) return 'text-red-500';
    if (s < 75) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getTrackColor = (s: number) => {
    if (s < 40) return '#EF4444'; // red-500
    if (s < 75) return '#FBBF24'; // yellow-400
    return '#4ADE80'; // green-400
  };

  return (
    <div className="relative my-4 flex items-center justify-center">
      <svg className="transform -rotate-90" width="160" height="160" viewBox="0 0 140 140">
        <circle
          className="text-brand-lighter"
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          r={radius}
          cx="70"
          cy="70"
        />
        <circle
          stroke={getTrackColor(score)}
          strokeWidth="12"
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="70"
          cy="70"
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
        <span className="text-sm font-semibold tracking-wider uppercase">Score</span>
      </div>
    </div>
  );
};

export default ScoreGauge;
