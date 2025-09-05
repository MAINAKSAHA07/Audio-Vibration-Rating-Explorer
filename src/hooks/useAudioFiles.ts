import { useState, useEffect, useCallback } from 'react';
import { awsS3Service } from '../utils/awsS3';

export interface AudioFileState {
  url: string | null;
  loading: boolean;
  error: string | null;
  source: 'aws' | 'local' | null;
}

export interface UseAudioFilesReturn {
  getAudioUrl: (filename: string) => Promise<string>;
  getVibrationUrl: (filename: string) => Promise<string>;
  preloadAudioFiles: (filenames: string[]) => Promise<Map<string, string>>;
  preloadVibrationFiles: (filenames: string[]) => Promise<Map<string, string>>;
  audioFileStates: Map<string, AudioFileState>;
  clearCache: () => void;
}

export const useAudioFiles = (): UseAudioFilesReturn => {
  const [audioFileStates, setAudioFileStates] = useState<Map<string, AudioFileState>>(new Map());

  const updateFileState = useCallback((filename: string, updates: Partial<AudioFileState>) => {
    setAudioFileStates(prev => {
      const newMap = new Map(prev);
      const currentState = newMap.get(filename) || { url: null, loading: false, error: null, source: null };
      newMap.set(filename, { ...currentState, ...updates });
      return newMap;
    });
  }, []);

  const getAudioUrl = useCallback(async (filename: string): Promise<string> => {
    console.log(`🔍 useAudioFiles: getAudioUrl called for: ${filename}`);
    
    // Check if we already have this file cached
    const existingState = audioFileStates.get(filename);
    if (existingState?.url && !existingState.loading) {
      console.log(`🔍 useAudioFiles: Using cached URL for ${filename}: ${existingState.url}`);
      return existingState.url;
    }

    // Set loading state
    updateFileState(filename, { loading: true, error: null });
    console.log(`🔍 useAudioFiles: Setting loading state for ${filename}`);

    try {
      console.log(`🔍 useAudioFiles: Calling awsS3Service.getAudioFileWithFallback for ${filename}`);
      const url = await awsS3Service.getAudioFileWithFallback(filename);
      const source = url.includes('s3.amazonaws.com') ? 'aws' : 'local';
      
      console.log(`🔍 useAudioFiles: Successfully got URL for ${filename}: ${url} (source: ${source})`);
      
      updateFileState(filename, { 
        url, 
        loading: false, 
        error: null, 
        source 
      });
      
      return url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load audio file';
      console.error(`❌ useAudioFiles: Error getting URL for ${filename}:`, error);
      updateFileState(filename, { 
        url: null, 
        loading: false, 
        error: errorMessage, 
        source: null 
      });
      throw error;
    }
  }, [audioFileStates, updateFileState]);

  const getVibrationUrl = useCallback(async (filename: string): Promise<string> => {
    // Check if we already have this file cached
    const existingState = audioFileStates.get(filename);
    if (existingState?.url && !existingState.loading) {
      return existingState.url;
    }

    // Set loading state
    updateFileState(filename, { loading: true, error: null });

    try {
      const url = await awsS3Service.getVibrationFileWithFallback(filename);
      const source = url.includes('s3.amazonaws.com') ? 'aws' : 'local';
      
      updateFileState(filename, { 
        url, 
        loading: false, 
        error: null, 
        source 
      });
      
      return url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load vibration file';
      updateFileState(filename, { 
        url: null, 
        loading: false, 
        error: errorMessage, 
        source: null 
      });
      throw error;
    }
  }, [audioFileStates, updateFileState]);

  const preloadAudioFiles = useCallback(async (filenames: string[]): Promise<Map<string, string>> => {
    const urlMap = new Map<string, string>();
    
    const promises = filenames.map(async (filename) => {
      try {
        const url = await getAudioUrl(filename);
        urlMap.set(filename, url);
      } catch (error) {
        console.warn(`Failed to preload audio file: ${filename}`, error);
      }
    });
    
    await Promise.all(promises);
    return urlMap;
  }, [getAudioUrl]);

  const preloadVibrationFiles = useCallback(async (filenames: string[]): Promise<Map<string, string>> => {
    const urlMap = new Map<string, string>();
    
    const promises = filenames.map(async (filename) => {
      try {
        const url = await getVibrationUrl(filename);
        urlMap.set(filename, url);
      } catch (error) {
        console.warn(`Failed to preload vibration file: ${filename}`, error);
      }
    });
    
    await Promise.all(promises);
    return urlMap;
  }, [getVibrationUrl]);

  const clearCache = useCallback(() => {
    setAudioFileStates(new Map());
  }, []);

  return {
    getAudioUrl,
    getVibrationUrl,
    preloadAudioFiles,
    preloadVibrationFiles,
    audioFileStates,
    clearCache,
  };
};
