interface PendingRequest {
  url: string;
  method: string;
  data?: any;
  timestamp: number;
}

interface CachedResponse {
  url: string;
  data: any;
  timestamp: number;
}

class OfflineSync {
  private static STORE_KEY = 'offline_pending_requests';
  private static CACHE_KEY = 'offline_cache_responses';

  static async saveForLater(request: PendingRequest) {
    const pending = this.getPendingRequests();
    pending.push(request);
    localStorage.setItem(this.STORE_KEY, JSON.stringify(pending));
  }

  static async cacheResponse(url: string, data: any) {
    const cached: CachedResponse[] = this.getCachedResponses();
    const existingIndex = cached.findIndex(item => item.url === url);

    const newCache: CachedResponse = {
      url,
      data,
      timestamp: Date.now()
    };

    if (existingIndex >= 0) {
      cached[existingIndex] = newCache;
    } else {
      cached.push(newCache);
    }

    localStorage.setItem(this.CACHE_KEY, JSON.stringify(cached));
  }

  static getCachedResponses(): CachedResponse[] {
    const stored = localStorage.getItem(this.CACHE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static getCachedResponse(url: string): any | null {
    const cached = this.getCachedResponses();
    const response = cached.find(item => item.url === url);
    return response ? response.data : null;
  }

  static getPendingRequests(): PendingRequest[] {
    const stored = localStorage.getItem(this.STORE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static clearPendingRequest(timestamp: number) {
    const pending = this.getPendingRequests();
    const filtered = pending.filter(req => req.timestamp !== timestamp);
    localStorage.setItem(this.STORE_KEY, JSON.stringify(filtered));
  }

  static async handleRequest(url: string, method: string, data?: any) {
    try {
      const axiosInstance = (await import('@/config/axios')).default;
      const response = await axiosInstance({
        url,
        method,
        data
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async syncPendingRequests() {
    const pending = this.getPendingRequests();

    for (const request of pending) {
      try {
        await this.handleRequest(request.url, request.method, request.data);
        this.clearPendingRequest(request.timestamp);
      } catch (error) {
        console.error('Error sincronizando petición:', error);
      }
    }
  }
}

export default OfflineSync;
