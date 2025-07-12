
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface SpinnerProps {
    progress: { current: number, total: number } | null;
}

const Spinner: React.FC<SpinnerProps> = ({ progress }) => {
  const { theme } = useTheme();
  
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
        <div className={`w-16 h-16 border-4 rounded-full animate-spin ${
          theme === 'dark' 
            ? 'border-t-white border-gray-600' 
            : 'border-t-black border-gray-300'
        }`}></div>
        <p className={`text-lg font-semibold animate-pulse ${
          theme === 'dark' ? 'text-white' : 'text-black'
        }`}>{getProgressText()}</p>
    </div>
  );
};

export default Spinner;
