
export interface Metric {
  name: string;
  score: number;
  weight: number;
  description: string;
}

export interface PageAnalysisResult {
  pageNumber: number;
  overallScore: number;
  metrics: Metric[];
}

export interface AnalysisResult {
  overallScore: number;
  pageCount: number;
  averageMetrics: Metric[];
  pageResults: PageAnalysisResult[];
}
