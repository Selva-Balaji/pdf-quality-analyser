
import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import ScoreGauge from './ScoreGauge';
import MetricBar from './MetricBar';

interface AnalysisResultsProps {
  result: AnalysisResult;
  onReset: () => void;
  fileName: string;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result, onReset, fileName }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <div className="w-full h-full flex flex-col items-center justify-start text-center animate-fade-in py-4">
      <div className="w-full">
        <h2 className="text-2xl font-bold text-brand-text">Analysis Complete</h2>
        <p className="text-gray-400 truncate px-4">{fileName}</p>
      </div>
      
      <ScoreGauge score={result.overallScore} />

      <div className="w-full flex-grow flex flex-col justify-center space-y-3 px-4">
        <div>
            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Average Metrics</p>
            <div className="space-y-2">
                {result.averageMetrics.map(metric => (
                <MetricBar key={metric.name} metric={metric} />
                ))}
            </div>
        </div>

        {result.pageCount > 1 && (
            <div>
                <button 
                    onClick={() => setShowBreakdown(p => !p)}
                    className="text-sm font-semibold text-brand-blue hover:text-blue-400 transition-colors py-2"
                >
                    {showBreakdown ? 'Hide' : 'Show'} Page Breakdown ({result.pageCount} Pages)
                </button>
                {showBreakdown && (
                    <div className="bg-brand-dark rounded-lg p-2 mt-2 max-h-32 overflow-y-auto text-left">
                        {result.pageResults.map(page => {
                             const getScoreColor = (s: number) => {
                                if (s < 40) return 'text-red-500';
                                if (s < 75) return 'text-yellow-400';
                                return 'text-green-400';
                            };
                            return (
                                <div key={page.pageNumber} className="flex justify-between items-center text-sm py-1 px-2 rounded hover:bg-brand-light">
                                    <span className="text-gray-300">Page {page.pageNumber}</span>
                                    <span className={`font-bold ${getScoreColor(page.overallScore)}`}>{Math.round(page.overallScore)} / 100</span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        )}
      </div>


      <button
        onClick={onReset}
        className="mt-4 px-8 py-3 bg-brand-blue text-white font-bold rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-light focus:ring-blue-500 transition-transform transform hover:scale-105"
      >
        Analyse Another PDF
      </button>
    </div>
  );
};

export default AnalysisResults;
