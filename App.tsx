
import React, { useState, useCallback } from 'react';
import { AnalysisResult } from './types';
import { analyzePdfQuality } from './services/analysisService';
import FileUpload from './components/FileUpload';
import AnalysisResults from './components/AnalysisResults';
import Spinner from './components/Spinner';
import ThemeToggle from './components/ThemeToggle';
import { useTheme } from './contexts/ThemeContext';

// Set up PDF.js worker
const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
if (pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}


const App: React.FC = () => {
  const { theme } = useTheme();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [allPagePreviews, setAllPagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [currentView, setCurrentView] = useState<'upload' | 'analysis'>('upload');


  const handleFileSelect = useCallback(async (file: File) => {
    if (!pdfjsLib) {
      setError("PDF processing library could not be loaded. Please refresh the page.");
      return;
    }

    setPdfFile(file);
    setAnalysis(null);
    setError(null);
    setAllPagePreviews([]);
    setCurrentView('upload');
  }, []);

  const handleStartAnalysis = useCallback(async () => {
    if (!pdfFile || !pdfjsLib || isLoading) return;

    setIsLoading(true);
    setError(null);
    setProgress({ current: 0, total: 0 });
    setCurrentView('analysis');

    try {
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        if (!e.target?.result) {
          throw new Error('Failed to read file for analysis.');
        }

        const typedarray = new Uint8Array(e.target.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        
        setProgress({ current: 0, total: pdf.numPages });

        // Generate previews for all pages
        const previews: string[] = [];
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 0.8 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            previews.push(canvas.toDataURL());
          }
        }
        setAllPagePreviews(previews);

        // Run analysis on the entire document
        const results = await analyzePdfQuality(pdf, (p) => {
            setProgress({ current: p.currentPage, total: p.totalPages });
        });
        setAnalysis(results);
      };
      fileReader.onerror = () => {
        throw new Error("Error reading the PDF file for analysis.");
      }
      fileReader.readAsArrayBuffer(pdfFile);
    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError(err.message || 'An unexpected error occurred during analysis.');
      setAnalysis(null);
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  }, [pdfFile, isLoading]);

  const handleReset = () => {
    setAnalysis(null);
    setPdfFile(null);
    setAllPagePreviews([]);
    setError(null);
    setIsLoading(false);
    setProgress(null);
    setCurrentView('upload');
  };

  return (
    <>
      <ThemeToggle />
      <div className={`min-h-screen flex flex-col items-center p-4 sm:p-6 lg:p-8 transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gray-900 text-white' 
          : 'bg-white text-black'
      }`}>
        <header className="w-full max-w-6xl text-center mb-8">
          <h1 className={`text-4xl sm:text-5xl font-bold tracking-tight ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}>PDF Quality Analyser</h1>
          <p className={`text-lg mt-2 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>Estimate PDF quality for OCR performance</p>
        </header>
        
        <main className={`w-full max-w-7xl flex-grow rounded-2xl shadow-2xl border p-6 lg:p-8 transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          {currentView === 'upload' && (
            <div className="flex flex-col items-center justify-center min-h-[600px] max-w-2xl mx-auto">
              {/* Upload Section */}
              <section className={`w-full rounded-xl p-8 border-2 border-dashed transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600'
                  : 'bg-white border-gray-300'
              }`}>
                <FileUpload onFileSelect={handleFileSelect} isProcessing={false} />
                
                {/* File Info and Process Button */}
                {pdfFile && !error && (
                  <div className="mt-8 text-center">
                     {/* File Info */}
                     <div className={`mb-6 p-4 rounded-lg ${
                       theme === 'dark' ? 'bg-gray-600' : 'bg-gray-100'
                     }`}>
                       <p className={`text-lg font-semibold ${
                         theme === 'dark' ? 'text-white' : 'text-black'
                       }`}>{pdfFile.name}</p>
                       <p className={`text-sm ${
                         theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                       }`}>Size: {(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                     </div>

                     {/* Process Button */}
                     <button
                       onClick={handleStartAnalysis}
                       disabled={isLoading}
                       className={`px-8 py-4 text-lg font-bold rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                         theme === 'dark'
                           ? 'bg-white text-gray-900 hover:bg-gray-200 focus:ring-gray-400 disabled:bg-gray-400'
                           : 'bg-black text-white hover:bg-gray-800 focus:ring-gray-600 disabled:bg-gray-400'
                       } disabled:cursor-not-allowed disabled:transform-none`}
                     >
                       {isLoading ? 'Processing...' : 'Analyze PDF Quality'}
                     </button>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="mt-8 text-center">
                    <div className="text-red-500">
                      <h3 className="text-xl font-bold mb-2">Error</h3>
                      <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{error}</p>
                      <button onClick={handleReset} className={`mt-4 px-6 py-2 font-semibold rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'bg-white text-gray-900 hover:bg-gray-200'
                          : 'bg-black text-white hover:bg-gray-800'
                      }`}>Try Again</button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {currentView === 'analysis' && (
            <div className="min-h-[600px]">
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full min-h-[600px]">
                  <Spinner progress={progress} />
                  <p className={`mt-4 text-lg ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>Analyzing PDF quality and generating previews...</p>
                </div>
              )}
              
              {error && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full min-h-[600px]">
                  <div className="text-center text-red-500 max-w-md">
                    <h3 className="text-xl font-bold mb-2">Analysis Failed</h3>
                    <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{error}</p>
                    <div className="mt-6 space-x-4">
                      <button onClick={handleReset} className={`px-6 py-2 font-semibold rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'bg-white text-gray-900 hover:bg-gray-200'
                          : 'bg-black text-white hover:bg-gray-800'
                      }`}>Start Over</button>
                      <button onClick={() => setCurrentView('upload')} className={`px-6 py-2 font-semibold rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'border-gray-500 text-gray-300 hover:bg-gray-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}>Go Back</button>
                    </div>
                  </div>
                </div>
              )}
              
              {!isLoading && !error && analysis && allPagePreviews.length > 0 && (
                <div className="flex justify-center">
                  <div className={`w-full rounded-xl p-6 ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                  }`}>
                    <AnalysisResults 
                      result={analysis} 
                      onReset={handleReset} 
                      fileName={pdfFile?.name || ''} 
                      allPagePreviews={allPagePreviews}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

         <footer className="w-full max-w-6xl text-center mt-8 text-gray-500">
          <p>Disclaimer: This is a client-side simulation. Quality scores are estimates based on image processing heuristics.</p>
        </footer>
      </div>
    </>
  );
};

export default App;
