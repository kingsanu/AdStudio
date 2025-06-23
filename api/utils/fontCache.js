// Simple in-memory cache utility for fonts
class FontCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
  }

  // Generate cache key
  generateKey(endpoint, query = {}) {
    const sortedQuery = Object.keys(query)
      .sort()
      .reduce((result, key) => {
        result[key] = query[key];
        return result;
      }, {});
    return `${endpoint}:${JSON.stringify(sortedQuery)}`;
  }

  // Set cache with TTL
  set(key, value, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, {
      value,
      expiry,
      createdAt: new Date().toISOString(),
    });
    console.log(`[FontCache] Cached: ${key} (expires in ${ttl / 1000 / 60} minutes)`);
  }

  // Get from cache
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      console.log(`[FontCache] Expired and removed: ${key}`);
      return null;
    }

    console.log(`[FontCache] Hit: ${key} (cached since ${cached.createdAt})`);
    return cached.value;
  }

  // Check if key exists and is valid
  has(key) {
    return this.get(key) !== null;
  }

  // Delete specific key
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`[FontCache] Deleted: ${key}`);
    }
    return deleted;
  }

  // Clear all cache
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[FontCache] Cleared all cache (${size} items)`);
  }

  // Get cache stats
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, data] of this.cache.entries()) {
      if (now > data.expiry) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
      memoryUsage: JSON.stringify(Array.from(this.cache.entries())).length,
    };
  }

  // Clean expired entries (can be called periodically)
  cleanup() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, data] of this.cache.entries()) {
      if (now > data.expiry) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[FontCache] Cleaned up ${cleanedCount} expired entries`);
    }

    return cleanedCount;
  }

  // Cache patterns for different data types
  cachePatterns = {
    // Font list queries (search results)
    FONT_LIST: { ttl: 2 * 24 * 60 * 60 * 1000 }, // 2 days
    
    // Individual font families  
    FONT_FAMILY: { ttl: 7 * 24 * 60 * 60 * 1000 }, // 7 days
    
    // Popular/trending fonts
    POPULAR_FONTS: { ttl: 1 * 24 * 60 * 60 * 1000 }, // 1 day
    
    // Draft fonts
    DRAFT_FONTS: { ttl: 6 * 60 * 60 * 1000 }, // 6 hours
  };

  // Convenience methods for different cache types
  setFontList(query, data) {
    const key = this.generateKey('fonts:list', query);
    this.set(key, data, this.cachePatterns.FONT_LIST.ttl);
  }

  getFontList(query) {
    const key = this.generateKey('fonts:list', query);
    return this.get(key);
  }

  setFontFamily(family, data) {
    const key = this.generateKey('fonts:family', { family });
    this.set(key, data, this.cachePatterns.FONT_FAMILY.ttl);
  }

  getFontFamily(family) {
    const key = this.generateKey('fonts:family', { family });
    return this.get(key);
  }

  setDraftFonts(data) {
    const key = 'fonts:draft';
    this.set(key, data, this.cachePatterns.DRAFT_FONTS.ttl);
  }

  getDraftFonts() {
    return this.get('fonts:draft');
  }

  // Invalidate all font caches (call when fonts are updated)
  invalidateFonts() {
    let deletedCount = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith('fonts:')) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    console.log(`[FontCache] Invalidated ${deletedCount} font cache entries`);
    return deletedCount;
  }
}

// Create singleton instance
const fontCache = new FontCache();

// Setup periodic cleanup (every hour)
setInterval(() => {
  fontCache.cleanup();
}, 60 * 60 * 1000);

// Log cache stats every 30 minutes in development
if (process.env.NODE_ENV !== 'production') {
  setInterval(() => {
    const stats = fontCache.getStats();
    console.log('[FontCache] Stats:', stats);
  }, 30 * 60 * 1000);
}

module.exports = fontCache;
