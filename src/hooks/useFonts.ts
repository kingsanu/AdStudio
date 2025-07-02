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

// Helper function to load font files into the browser
const loadFontFile = async (fontName: string, fontUrl?: string): Promise<boolean> => {
  try {
    // Check if font is already loaded
    if (document.fonts.check(`16px "${fontName}"`)) {
      return true;
    }

    // If we have a font URL, load it
    if (fontUrl) {
      const fontFace = new FontFace(fontName, `url(${fontUrl})`);
      await fontFace.load();
      document.fonts.add(fontFace);
      return true;
    }

    // Try to load from Google Fonts as fallback
    const googleFontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName.replace(/\s+/g, '+'))}:wght@400&display=swap`;

    // Create link element to load Google Font
    const link = document.createElement('link');
    link.href = googleFontUrl;
    link.rel = 'stylesheet';
    link.type = 'text/css';

    // Add to document head
    document.head.appendChild(link);

    // Wait for font to load
    await new Promise((resolve) => {
      const checkFont = () => {
        if (document.fonts.check(`16px "${fontName}"`)) {
          resolve(true);
        } else {
          setTimeout(checkFont, 100);
        }
      };
      checkFont();
      // Timeout after 3 seconds
      setTimeout(() => resolve(false), 3000);
    });

    return document.fonts.check(`16px "${fontName}"`);
  } catch (error) {
    console.warn(`Failed to load font file for ${fontName}:`, error);
    return false;
  }
};

// Hook for lazy loading fonts on demand (only when needed for preview)
export const useLazyFontLoad = () => {
  const queryClient = useQueryClient();
  const baseUrl = import.meta.env.VITE_API_URL || "https://adstudioserver.foodyqueen.com";

  const loadFontFamily = async (family: string): Promise<FontDataApi | null> => {
    // Check if already cached
    const cached = queryClient.getQueryData(fontKeys.family(family));
    if (cached) {
      // Still try to load the font file for preview
      await loadFontFile(family);
      return cached as FontDataApi;
    }

    try {
      const response = await axios.get<FontDataApi>(
        `${baseUrl}/api/fonts/family/${encodeURIComponent(family)}`
      );

      // Cache the result
      queryClient.setQueryData(fontKeys.family(family), response.data);

      // Load the font files for preview (try the first style)
      if (response.data.styles && response.data.styles.length > 0) {
        await loadFontFile(family, response.data.styles[0].url);
      } else {
        await loadFontFile(family);
      }

      return response.data;
    } catch (error) {
      console.error(`Failed to load font family: ${family}`, error);
      return null;
    }
  };

  return { loadFontFamily };
};

// Hook for loading fonts with virtual scrolling and better performance
export const useVirtualizedFonts = (keyword?: string, pageSize: number = 50) => {
  const baseUrl = import.meta.env.VITE_API_URL || "https://adstudioserver.foodyqueen.com";

  return useInfiniteQuery({
    queryKey: [...fontKeys.all, 'virtualized', keyword || 'all', pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        ps: pageSize.toString(),
        pi: pageParam.toString(),
      });

      if (keyword) {
        params.append('kw', keyword);
      }

      const response = await axios.get<FontResponse>(
        `${baseUrl}/api/fonts?${params.toString()}`
      );
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.page + 1
        : undefined;
    },
    initialPageParam: 0,
    enabled: !!baseUrl,
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
  });
};

// Hook for loading popular/essential fonts only (for quick preview)
export const usePopularFonts = (limit: number = 20) => {
  const baseUrl = import.meta.env.VITE_API_URL || "https://adstudioserver.foodyqueen.com";

  return useQuery({
    queryKey: [...fontKeys.all, 'popular', limit],
    queryFn: async () => {
      const response = await axios.get<FontResponse>(
        `${baseUrl}/api/fonts?ps=${limit}&pi=0&popular=true`
      );
      return response.data.data;
    },
    enabled: !!baseUrl,
    staleTime: 1000 * 60 * 60 * 2, // 2 hours - popular fonts change less frequently
    gcTime: 1000 * 60 * 60 * 4, // 4 hours
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
