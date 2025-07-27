export interface RatingData {
  id: string;
  class: string;
  category: string;
  design: string;
  rating: number;
  audioFile: string;
  vibrationFile: string;
}

export interface SummaryData {
  totalEntries: number;
  uniqueAudioFiles: number;
  uniqueClasses: number;
  categories: Record<string, number>;
  designs: string[];
  averageRatings: Record<string, number>;
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