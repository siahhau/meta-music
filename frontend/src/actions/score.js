// actions/score.js
import useSWR from 'swr';
import { useMemo } from 'react';
import axios from 'axios';

// ----------------------------------------------------------------------

// Custom fetcher for score data
const scoreFetcher = async (url) => {
  const response = await axios.get(url, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

// SWR configuration options
const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

export function useGetScoreData(spotifyId) {
  const url = spotifyId ? `http://localhost:8000/tracks/spotify/${spotifyId}/scores` : null;

  const { data, error, isLoading, isValidating } = useSWR(url, scoreFetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      scoreData: data?.score_data || null,
      scoreLoading: isLoading,
      scoreError: error,
      scoreValidating: isValidating,
      scoreEmpty: !isLoading && !data?.score_data,
    }),
    [data?.score_data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// Optional: Add more specialized hooks if needed
export function useGetMultipleScores(spotifyIds = []) {
  // Create an array of SWR keys for multiple tracks
  const keys = spotifyIds.map(id => 
    id ? `http://localhost:8000/tracks/spotify/${id}/scores` : null
  ).filter(Boolean);

  // Optional: Use SWR's useSWRs for multiple fetches
  // const { data, error } = useSWRs(keys, scoreFetcher, swrOptions);
  
  // Simpler approach: individual hooks in an array
  const results = keys.map((key, index) => {
    const { data, error, isLoading } = useSWR(key, scoreFetcher, swrOptions);
    return {
      spotifyId: spotifyIds[index],
      scoreData: data?.score_data || null,
      loading: isLoading,
      error
    };
  });

  return { results };
}

// Validate score data utility function
export function validateScoreData(data) {
  if (!data) return false;
  
  // Check required fields
  const requiredFields = ['notes', 'tempos', 'meters'];
  for (const field of requiredFields) {
    if (!data[field] || !Array.isArray(data[field]) || data[field].length === 0) {
      console.warn(`乐谱数据缺少必要字段: ${field}`);
      return false;
    }
  }
  
  return true;
}