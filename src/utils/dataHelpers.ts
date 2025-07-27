import { RatingData } from './api';

export interface DesignStats {
  design: string;
  averageRating: number;
  count: number;
  minRating: number;
  maxRating: number;
}

export interface CategoryStats {
  category: string;
  designs: DesignStats[];
  totalCount: number;
}

export interface ClassStats {
  class: string;
  category: string;
  designs: DesignStats[];
  totalCount: number;
}

export function getDesignStats(data: RatingData[], design: string): DesignStats {
  const designData = data.filter(d => d.design === design);
  const ratings = designData.map(d => d.rating);
  
  return {
    design,
    averageRating: ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length,
    count: ratings.length,
    minRating: Math.min(...ratings),
    maxRating: Math.max(...ratings)
  };
}

export function getCategoryStats(data: RatingData[], category: string): CategoryStats {
  const categoryData = data.filter(d => d.category === category);
  const designs = ['freqshift', 'hapticgen', 'percept', 'pitchmatch'];
  
  return {
    category,
    designs: designs.map(design => getDesignStats(categoryData, design)),
    totalCount: categoryData.length / designs.length // Divide by number of designs
  };
}

export function getClassStats(data: RatingData[], classCode: string): ClassStats {
  const classData = data.filter(d => d.class === classCode);
  const designs = ['freqshift', 'hapticgen', 'percept', 'pitchmatch'];
  const category = classData[0]?.category || 'Unknown';
  
  return {
    class: classCode,
    category,
    designs: designs.map(design => getDesignStats(classData, design)),
    totalCount: classData.length / designs.length
  };
}

export function getUniqueCategories(data: RatingData[]): string[] {
  return [...new Set(data.map(d => d.category))].sort();
}

export function getUniqueClasses(data: RatingData[]): string[] {
  return [...new Set(data.map(d => d.class))].sort();
}

export function getAudioFilesForClass(data: RatingData[], classCode: string): RatingData[] {
  return data.filter(d => d.class === classCode && d.design === 'freqshift'); // Use one design to get unique audio files
}

export function getVibrationFilesForAudio(data: RatingData[], audioId: string): RatingData[] {
  return data.filter(d => d.id === audioId);
} 