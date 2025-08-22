export interface RatingData {
  id: string;
  class: string;
  category: string;
  design: string;
  rating: number;
  audioFile: string;
  vibrationFile: string;
  target: string;
  fold: string;
  clip_id: string;
  take: string;
  ratingCategory: string;
  soundname?: string; // New field for the soundname from CSV
}

export interface SummaryData {
  totalEntries: number;
  uniqueAudioFiles: number;
  uniqueClasses: number;
  uniqueCategories: number;
  uniqueTargets: number;
  uniqueFolds: number;
  categories: Record<string, number>;
  designs: string[];
  ratingCategories: Record<string, number>;
  averageRatings: {
    overall: number;
    byDesign: Record<string, number>;
    byCategory: Record<string, number>;
  };
  categoryAverages: Record<string, number>;
  designAverages: Record<string, number>;
  foldDistribution: Record<string, number>;
  targetDistribution: Record<string, number>;
  classDistribution: Record<string, number>;
}

export interface MetadataData {
  datasetInfo: {
    name: string;
    description: string;
    audioFiles: number;
    vibrationFiles: number;
    totalRatings: number;
    dateProcessed: string;
    dataSource: string;
  };
  fileStructure: {
    audioPath: string;
    vibrationPath: string;
    audioFormat: string;
    vibrationTypes: string[];
  };
  categories: Array<{
    name: string;
    count: number;
    averageRating: number;
  }>;
  ratingAnalysis: {
    minRating: number;
    maxRating: number;
    medianRating: number;
    stdDeviation: number;
    ratingRanges: Record<string, number>;
  };
}

export async function fetchRatings(): Promise<RatingData[]> {
  try {
    const response = await fetch('/data/ratings.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching ratings:', error);
    throw error;
  }
}

export async function fetchSummary(): Promise<SummaryData> {
  try {
    const response = await fetch('/data/summary.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching summary:', error);
    throw error;
  }
}

export async function fetchMetadata(): Promise<MetadataData> {
  try {
    const response = await fetch('/data/metadata.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching metadata:', error);
    throw error;
  }
} 