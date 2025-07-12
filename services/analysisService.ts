
import { AnalysisResult, Metric, PageAnalysisResult } from '../types';

// Using 'any' for pdfjs types because they are not easily available in this environment.
type PdfJsPage = any; 
type PdfJsDocument = any;

// --- Configuration for Metrics ---
const METRIC_CONFIG = {
  TEXT_CLARITY: { weight: 55, description: "Measures sharpness, contrast, and text uniformity. A high score indicates clear, printed text. Lower scores can be due to blur, low contrast, or handwritten text." },
  NOISE_LEVEL: { weight: 20, description: "Estimates the amount of random speckles or marks on the page. Lower noise results in a higher score." },
  SKEW_ROTATION: { weight: 25, description: "Detects if the document is tilted. A perfectly aligned document scores higher, as skew can confuse OCR engines." },
};

type ProgressCallback = (progress: { currentPage: number, totalPages: number }) => void;

/**
 * Main analysis function. Iterates through all PDF pages, runs analysis on each,
 * and returns an aggregated result.
 */
export const analyzePdfQuality = async (pdf: PdfJsDocument, onProgress: ProgressCallback): Promise<AnalysisResult> => {
  const pageResults: PageAnalysisResult[] = [];
  const numPages = pdf.numPages;

  for (let i = 1; i <= numPages; i++) {
    onProgress({ currentPage: i, totalPages: numPages });
    const page = await pdf.getPage(i);
    const singlePageResult = await analyzeSinglePage(page);
    pageResults.push({
      pageNumber: i,
      ...singlePageResult
    });
  }

  // Calculate overall average score from all pages
  const overallScore = pageResults.reduce((acc, r) => acc + r.overallScore, 0) / numPages;
  
  // Calculate average metrics for the main display
  const averageMetrics = calculateAverageMetrics(pageResults);

  return { 
    overallScore, 
    pageCount: numPages,
    averageMetrics,
    pageResults
  };
};

/**
 * Calculates the average score for each metric type across all pages.
 */
function calculateAverageMetrics(pageResults: PageAnalysisResult[]): Metric[] {
    const metricTotals: { [name: string]: { totalScore: number, count: number, config: Omit<Metric, 'score'> } } = {};

    for (const result of pageResults) {
        for (const metric of result.metrics) {
            if (!metricTotals[metric.name]) {
                metricTotals[metric.name] = { totalScore: 0, count: 0, config: { name: metric.name, weight: metric.weight, description: metric.description } };
            }
            metricTotals[metric.name].totalScore += metric.score;
            metricTotals[metric.name].count++;
        }
    }
    
    return Object.values(metricTotals).map(m => ({
        ...m.config,
        score: m.totalScore / m.count
    }));
}


/**
 * Runs all metric calculations on a single PDF page.
 */
const analyzeSinglePage = async (page: PdfJsPage): Promise<Omit<PageAnalysisResult, 'pageNumber'>> => {
    const viewport = page.getViewport({ scale: 1.5 }); // Use a higher scale for better analysis
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error("Could not create canvas context for analysis.");

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport: viewport }).promise;
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Run all analyses
    const clarityScore = analyzeClarity(imageData);
    const noiseScore = analyzeNoise(imageData);
    const skewScore = analyzeSkew(imageData);

    const metrics: Metric[] = [
        { name: 'Text Clarity', score: clarityScore, ...METRIC_CONFIG.TEXT_CLARITY },
        { name: 'Noise Level', score: noiseScore, ...METRIC_CONFIG.NOISE_LEVEL },
        { name: 'Skew / Rotation', score: skewScore, ...METRIC_CONFIG.SKEW_ROTATION },
    ];

    // Calculate weighted overall score for this page
    const totalWeight = metrics.reduce((acc, metric) => acc + metric.weight, 0);
    const overallScore = metrics.reduce((acc, metric) => acc + (metric.score * metric.weight), 0) / totalWeight;
    
    return { overallScore, metrics };
};


// --- Individual Metric Analysis Functions (Unchanged) ---

/**
 * Heuristic for Text Clarity. This is a combined score based on:
 * 1. Sharpness (from local contrast).
 * 2. Text Uniformity (penalty for handwriting).
 */
function analyzeClarity(imageData: ImageData): number {
  // --- Part 1: Sharpness from local variance ---
  const { data, width, height } = imageData;
  let totalVariance = 0;
  const samples = 5000;

  for (let i = 0; i < samples; i++) {
    const x = Math.floor(Math.random() * (width - 2)) + 1;
    const y = Math.floor(Math.random() * (height - 2)) + 1;

    const neighborhood: number[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const index = ((y + dy) * width + (x + dx)) * 4;
        const grayscale = 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
        neighborhood.push(grayscale);
      }
    }
    
    const mean = neighborhood.reduce((a, b) => a + b, 0) / 9;
    const variance = neighborhood.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 9;
    totalVariance += variance;
  }
  
  const avgVariance = totalVariance / samples;
  const originalScore = (avgVariance / 150) * 100;

  let sharpnessScore;
  if (originalScore >= 80) {
    // Map [80, 100] -> [40, 100]
    sharpnessScore = 40 + (originalScore - 80) * 3;
  } else {
    // Map [0, 80) -> [0, 40)
    sharpnessScore = originalScore * 0.5;
  }
  sharpnessScore = Math.max(0, Math.min(100, sharpnessScore));

  // --- Part 2: Uniformity (penalty for handwriting) ---
  const uniformityScore = calculateTextUniformityScore(imageData);

  // --- Part 3: Combine scores ---
  // Sharpness is the main factor, uniformity (handwriting) is a modifier.
  const combinedScore = (sharpnessScore * 0.7) + (uniformityScore * 0.3);

  return Math.max(0, Math.min(100, combinedScore));
}


/**
 * Heuristic for Noise: A clean document has mostly background and foreground color.
 * We find these two dominant colors and count pixels that are neither.
 */
function analyzeNoise(imageData: ImageData): number {
  const { data, width, height } = imageData;
  const colorCounts: { [key: string]: number } = {};

  // Downsample for performance
  for (let i = 0; i < data.length; i += 32) { // Sample every 8th pixel
      const r = data[i], g = data[i+1], b = data[i+2];
      // Quantize colors to reduce color space
      const key = `${Math.round(r/16)},${Math.round(g/16)},${Math.round(b/16)}`;
      colorCounts[key] = (colorCounts[key] || 0) + 1;
  }

  const sortedColors = Object.entries(colorCounts).sort(([, a], [, b]) => b - a);
  const bgColor = sortedColors[0]?.[0];
  const fgColor = sortedColors[1]?.[0];

  if(!bgColor || !fgColor) return 100; // Likely a blank page

  let noisyPixels = 0;
  let totalPixels = 0;
  Object.entries(colorCounts).forEach(([key, count]) => {
      if(key !== bgColor && key !== fgColor) {
          noisyPixels += count;
      }
      totalPixels += count;
  });

  const noisePercentage = (noisyPixels / totalPixels) * 100;
  // Penalize noise. A 5% noise level results in a score of 85.
  const score = Math.max(0, 100 - (noisePercentage * 3));
  return score;
}

/**
 * Heuristic for Skew: A very simplified Hough Transform-like approach.
 * We project binarized pixels at different angles and find the angle with the sharpest projection profile.
 */
function analyzeSkew(imageData: ImageData): number {
  const { data, width, height } = imageData;
  const threshold = 128;
  const binary = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
      const grayscale = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (grayscale < threshold) {
          binary[i / 4] = 1;
      }
  }

  let bestAngle = 0;
  let maxVariance = 0;

  for (let angle = -5; angle <= 5; angle += 0.5) {
      const rad = angle * (Math.PI / 180);
      const sin = Math.sin(rad);
      const cos = Math.cos(rad);
      const projection: number[] = new Array(height).fill(0);

      for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
              if (binary[y * width + x]) {
                  const p = Math.round(x * sin + y * cos);
                  if (p >= 0 && p < height) {
                      projection[p]++;
                  }
              }
          }
      }

      const mean = projection.reduce((a, b) => a + b, 0) / projection.length;
      const variance = projection.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / projection.length;

      if (variance > maxVariance) {
          maxVariance = variance;
          bestAngle = angle;
      }
  }
  
  const score = 100 - Math.abs(bestAngle) * 15; // Penalize up to 75 points for 5 degrees
  return Math.max(0, score);
}

/**
 * Heuristic for Text Uniformity: Measures uniformity of text strokes.
 * Printed text has uniform strokes (strong peaks in angle histogram),
 * while handwriting has varied strokes (flatter histogram).
 * Returns a score from 0-100 where 100 is highly uniform (printed).
 */
function calculateTextUniformityScore(imageData: ImageData): number {
    const { data, width, height } = imageData;

    const grayscale = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
        grayscale[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
    const angleHistogram = new Array(8).fill(0);
    let strongEdgeCount = 0;
    const magnitudeThreshold = 50;

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let gx = 0;
            let gy = 0;
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const pixelVal = grayscale[(y + ky) * width + (x + kx)];
                    gx += pixelVal * sobelX[ky + 1][kx + 1];
                    gy += pixelVal * sobelY[ky + 1][kx + 1];
                }
            }

            const magnitude = Math.sqrt(gx * gx + gy * gy);
            if (magnitude > magnitudeThreshold) {
                strongEdgeCount++;
                let angle = Math.atan2(gy, gx) * (180 / Math.PI);
                if (angle < 0) angle += 360;
                const bin = Math.floor(angle / 45);
                angleHistogram[bin]++;
            }
        }
    }

    if (strongEdgeCount < 1000) return 100; // Not enough edges to analyze, assume consistent.

    const normalizedHistogram = angleHistogram.map(count => count / strongEdgeCount);
    const normalizedMean = 1 / 8; // 0.125
    const normalizedVariance = normalizedHistogram.reduce((acc, p) => acc + Math.pow(p - normalizedMean, 2), 0) / 8;
    
    // Max variance for an 8-bin normalized histogram is approx 0.109, when all edges fall into one bin.
    const maxVariance = 7 / 64; // ~0.109375
    const score = (normalizedVariance / maxVariance) * 100;

    return Math.min(100, score);
}
