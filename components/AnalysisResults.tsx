
import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import ScoreGauge from './ScoreGauge';
import MetricBar from './MetricBar';
import { useTheme } from '../contexts/ThemeContext';

interface AnalysisResultsProps {
  result: AnalysisResult;
  onReset: () => void;
  fileName: string;
  allPagePreviews: string[];
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result, onReset, fileName, allPagePreviews }) => {
  const { theme } = useTheme();
  const [showPagePreview, setShowPagePreview] = useState(false);

  return (
    <div className="w-full h-full flex">
      {/* Main Analysis Section */}
      <div className={`${showPagePreview ? 'w-1/2 pr-4' : 'w-full'} transition-all duration-300`}>
        <div className="w-full h-full flex flex-col items-center justify-start text-center animate-fade-in py-4">
          <div className="w-full">
            <h2 className={`text-3xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-black'
            }`}>Analysis Complete</h2>
            <p className={`truncate px-4 text-lg ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>{fileName}</p>
          </div>
          
          <ScoreGauge score={result.overallScore} />

          <div className="w-full flex-grow flex flex-col justify-center space-y-4 px-4 max-w-md mx-auto">
            <div>
                <p className={`text-sm font-bold uppercase tracking-wider mb-3 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>Quality Metrics</p>
                <div className="space-y-3">
                    {result.averageMetrics.map(metric => (
                    <MetricBar key={metric.name} metric={metric} />
                    ))}
                </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3 mt-4">
            <button
              onClick={() => setShowPagePreview(!showPagePreview)}
              className={`px-8 py-3 font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all transform hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-gray-600 text-white hover:bg-gray-500 focus:ring-gray-400'
                  : 'bg-gray-200 text-black hover:bg-gray-300 focus:ring-gray-600'
              }`}
            >
              {showPagePreview ? 'Hide Page Breakdown' : 'Show Page Breakdown'}
            </button>
            
            <button
              onClick={onReset}
              className={`px-8 py-3 font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all transform hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-white text-gray-900 hover:bg-gray-200 focus:ring-gray-400'
                  : 'bg-black text-white hover:bg-gray-800 focus:ring-gray-600'
              }`}
            >
              Analyse Another PDF
            </button>
          </div>
        </div>
      </div>

      {/* Page Preview Section - Slides in from right */}
      {showPagePreview && (
        <div className={`w-1/2 pl-4 rounded-xl p-6 animate-fade-in ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-white'
        }`}>
          <h3 className={`text-xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}>Page Breakdown ({allPagePreviews.length})</h3>
          
          <div className="max-h-[600px] overflow-y-auto space-y-4">
            {allPagePreviews.map((preview, index) => {
              const pageResult = result.pageResults.find(p => p.pageNumber === index + 1);
              const score = pageResult ? pageResult.overallScore : 0;
              
              const getScoreColor = (s: number) => {
                if (s < 40) return 'text-red-500';
                if (s < 75) return 'text-amber-500';
                return 'text-green-600';
              };

              return (
                <div key={index} className={`border rounded-lg p-3 ${
                  theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                }`}>
                  <div className="flex items-start space-x-4">
                    <img 
                      src={preview} 
                      alt={`Page ${index + 1}`}
                      className="w-24 h-auto rounded border"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className={`font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-black'
                        }`}>Page {index + 1}</h4>
                        <span className={`font-bold ${getScoreColor(score)}`}>
                          {Math.round(score)}/100
                        </span>
                      </div>
                      {pageResult && (
                        <div className="space-y-1">
                          {pageResult.metrics.map((metric, metricIndex) => (
                            <div key={metricIndex} className="flex justify-between text-sm">
                              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                                {metric.name}
                              </span>
                              <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}>
                                {Math.round(metric.score)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisResults;
