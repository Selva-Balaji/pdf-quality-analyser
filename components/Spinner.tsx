
import React from 'react';

interface SpinnerProps {
    progress: { current: number, total: number } | null;
}

const Spinner: React.FC<SpinnerProps> = ({ progress }) => {
  const getProgressText = () => {
    if (!progress || progress.total <= 1) {
        return "Analysing PDF...";
    }
    if(progress.current === 0) {
        return `Preparing to analyse ${progress.total} pages...`
    }
    return `Analysing page ${progress.current} of ${progress.total}...`;
  }
  
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-t-brand-blue border-brand-lighter rounded-full animate-spin"></div>
        <p className="text-lg text-gray-300 font-semibold animate-pulse">{getProgressText()}</p>
    </div>
  );
};

export default Spinner;
