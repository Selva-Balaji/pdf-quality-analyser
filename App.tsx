
import React, { useState, useCallback } from 'react';
import { AnalysisResult } from './types';
import { analyzePdfQuality } from './services/analysisService';
import FileUpload from './components/FileUpload';
import AnalysisResults from './components/AnalysisResults';
import Spinner from './components/Spinner';

// Set up PDF.js worker
const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
if (pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}


const App: React.FC = () => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);


  const handleFileSelect = useCallback(async (file: File) => {
    if (!pdfjsLib) {
      setError("PDF processing library could not be loaded. Please refresh the page.");
      return;
    }
    
    if (isLoading) return;

    setPdfFile(file);
    setAnalysis(null);
    setError(null);
    setIsLoading(true);
    setPdfPreview(null);
    setProgress({ current: 0, total: 0 });


    try {
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        if (!e.target?.result) {
          throw new Error('Failed to read file for preview.');
        }

        const typedarray = new Uint8Array(e.target.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        
        setProgress({ current: 0, total: pdf.numPages });

        // Create a preview from the first page
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          setPdfPreview(canvas.toDataURL());
        } else {
            throw new Error("Could not create canvas context for preview.");
        }

        // Run analysis on the entire document
        const results = await analyzePdfQuality(pdf, (p) => {
            setProgress({ current: p.currentPage, total: p.totalPages });
        });
        setAnalysis(results);
      };
      fileReader.onerror = () => {
        throw new Error("Error reading the PDF file.");
      }
      fileReader.readAsArrayBuffer(file);
    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError(err.message || 'An unexpected error occurred during analysis.');
      setAnalysis(null);
      setPdfPreview(null);
    } finally {
      // Note: We don't set loading to false here, because fileReader is async.
      // It will be set inside the onload/onerror handlers indirectly.
      // But if getDocument fails, we need to stop loading.
      if (!pdfFile) {
        setIsLoading(false);
        setProgress(null);
      }
    }
  }, [isLoading, pdfFile]);

  const handleReset = () => {
    setAnalysis(null);
    setPdfFile(null);
    setPdfPreview(null);
    setError(null);
    setIsLoading(false);
    setProgress(null);
  };

  const handleAnalysisComplete = () => {
      setIsLoading(false);
      setProgress(null);
  }

  // Effect to handle the end of loading state when analysis is complete
  React.useEffect(() => {
    if(analysis || error) {
      handleAnalysisComplete();
    }
  }, [analysis, error]);

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-6xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-brand-text tracking-tight">PDF Quality Analyser</h1>
        <p className="text-lg text-gray-400 mt-2">Estimate PDF quality for OCR performance</p>
      </header>
      
      <main className="w-full max-w-6xl flex-grow bg-brand-medium rounded-2xl shadow-2xl p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          <div className="flex flex-col items-center justify-center bg-brand-light rounded-xl p-6 border-2 border-dashed border-brand-lighter h-full">
            <FileUpload onFileSelect={handleFileSelect} isProcessing={isLoading} />
            {pdfPreview && !isLoading && !error && (
              <div className="mt-6 w-full text-center">
                 <h3 className="font-bold text-lg mb-2">Page 1 Preview</h3>
                 <img src={pdfPreview} alt="PDF Preview" className="rounded-lg shadow-lg mx-auto border-4 border-brand-lighter" style={{maxHeight: '400px'}}/>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center bg-brand-light rounded-xl p-6 min-h-[400px] lg:min-h-0">
            {isLoading && <Spinner progress={progress} />}
            {error && !isLoading && (
              <div className="text-center text-red-400">
                <h3 className="text-xl font-bold mb-2">Analysis Failed</h3>
                <p>{error}</p>
                <button onClick={handleReset} className="mt-4 px-6 py-2 bg-brand-blue text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors">Try again</button>
              </div>
            )}
            {!isLoading && !error && analysis && (
               <AnalysisResults result={analysis} onReset={handleReset} fileName={pdfFile?.name || ''} />
            )}
            {!isLoading && !error && !analysis && (
              <div className="text-center text-gray-400">
                <h3 className="text-xl font-bold">Awaiting PDF</h3>
                <p>Upload a document to begin the quality analysis.</p>
              </div>
            )}
          </div>
        </div>
      </main>

       <footer className="w-full max-w-6xl text-center mt-8 text-gray-500">
        <p>Disclaimer: This is a client-side simulation. Quality scores are estimates based on image processing heuristics.</p>
      </footer>
    </div>
  );
};

export default App;
