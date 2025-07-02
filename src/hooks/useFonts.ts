import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { FontDataApi, GetFontQuery } from "canva-editor/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://adstudioserver.foodyqueen.com";

interface FontResponse {
  data: FontDataApi[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

// Font query keys factory
export const fontKeys = {
  all: ['fonts'] as const,
  lists: () => [...fontKeys.all, 'list'] as const,
  list: (filters: GetFontQuery) => [...fontKeys.lists(), filters] as const,
  family: (family: string) => [...fontKeys.all, 'family', family] as const,
};

// Hook for fetching fonts with pagination
export const useFonts = (query: GetFontQuery = {}) => {
  return useQuery({
    queryKey: fontKeys.list(query),
    queryFn: async ({ queryKey }) => {
      const [, , filters] = queryKey;
      const params = new URLSearchParams();
      
      Object.entries(filters as GetFontQuery).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else if (value !== undefined) {
          params.append(key, String(value));
        }
      });

      const response = await axios.get<FontResponse>(
        `${API_BASE_URL}/api/fonts?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes - fonts don't change often
    gcTime: 1000 * 60 * 60, // 1 hour garbage collection time
    retry: 2,
  });
};

// Hook for infinite scrolling fonts
export const useFontsInfinite = (baseQuery: Omit<GetFontQuery, 'pi'> = {}) => {
  return useInfiniteQuery({
    queryKey: [...fontKeys.lists(), 'infinite', baseQuery],
    queryFn: async ({ pageParam = 0 }) => {
      const query = { ...baseQuery, pi: String(pageParam), ps: '30' };
      const params = new URLSearchParams();
      
      Object.entries(query).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else if (value !== undefined) {
          params.append(key, String(value));
        }
      });

      const response = await axios.get<FontResponse>(
        `${API_BASE_URL}/api/fonts?${params.toString()}`
      );
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore 
        ? lastPage.pagination.page + 1 
        : undefined;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
  });
};

// Hook for fetching a specific font family
export const useFontFamily = (family: string) => {
  return useQuery({
    queryKey: fontKeys.family(family),
    queryFn: async () => {
      const response = await axios.get<FontDataApi>(
        `${API_BASE_URL}/api/fonts/family/${encodeURIComponent(family)}`
      );
      return response.data;
    },
    enabled: !!family,
    staleTime: 1000 * 60 * 30, // 30 minutes - individual families change even less
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    retry: 2,
  });
};

// Hook for loading ALL fonts at once (no pagination) - uses backend caching
export const useAllFonts = (keyword?: string, apiBaseUrl?: string) => {
  const baseUrl =  import.meta.env.VITE_API_URL || "https://adstudioserver.foodyqueen.com";
  
  return useQuery({
    queryKey: [...fontKeys.all, 'bulk', keyword || 'all', baseUrl],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (keyword) {
        params.append('kw', keyword);
      }
      
      const response = await axios.get<FontDataApi[]>(
        `${baseUrl}/api/fonts/all${params.toString() ? `?${params.toString()}` : ''}`
      );
      return response.data;
    },
    enabled: !!baseUrl, // Only run if we have a valid API URL
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - all fonts cached on backend for 3 days
    gcTime: 1000 * 60 * 60 * 24 * 2, // 2 days garbage collection time
    retry: 2,
  });
};

// Hook for prefetching popular fonts
export const usePrefetchPopularFonts = () => {
  const queryClient = useQueryClient();
  
  return () => {
    // Prefetch the first page of fonts (most popular)
    queryClient.prefetchQuery({
      queryKey: fontKeys.list({ ps: '30', pi: '0' }),
      queryFn: async () => {
        const response = await axios.get<FontResponse>(
          `${API_BASE_URL}/api/fonts?ps=30&pi=0`
        );
        return response.data;
      },
      staleTime: 1000 * 60 * 15,
    });
  };
};

// Hook for invalidating font cache
export const useInvalidateFonts = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: fontKeys.all }),
    invalidateList: (filters?: GetFontQuery) => 
      queryClient.invalidateQueries({ queryKey: fontKeys.list(filters || {}) }),
    invalidateFamily: (family: string) => 
      queryClient.invalidateQueries({ queryKey: fontKeys.family(family) }),
  };
};
