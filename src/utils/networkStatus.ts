// Utility for handling network status and offline functionality

type NetworkStatusListener = (online: boolean, serverAvailable?: boolean) => void;

class NetworkStatusManager {
  private listeners: NetworkStatusListener[] = [];
  private isOnline: boolean = navigator.onLine;
  private isServerAvailable: boolean = true;
  private pingInterval: number | null = null;
  private readonly PING_INTERVAL = 30000; // 30 segundos

  constructor() {
    this.setupEventListeners();
    this.startPingServer();
  }

  private setupEventListeners() {
    window.addEventListener('online', () => this.updateOnlineStatus(true));
    window.addEventListener('offline', () => this.updateOnlineStatus(false));
  }

  private updateOnlineStatus(online: boolean) {
    this.isOnline = online;
    if (online) {
      this.checkServerAvailability();
    } else {
      this.isServerAvailable = false;
      this.notifyListeners();
    }
  }

  private async checkServerAvailability() {
    try {
      const response = await fetch('https://web-production-6342.up.railway.app/api/health', {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      this.isServerAvailable = response.ok;
    } catch (error) {
      this.isServerAvailable = false;
    }
    this.notifyListeners();
  }

  private startPingServer() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    this.pingInterval = window.setInterval(() => {
      if (this.isOnline) {
        this.checkServerAvailability();
      }
    }, this.PING_INTERVAL);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline, this.isServerAvailable));
  }

  public addListener(listener: NetworkStatusListener) {
    this.listeners.push(listener);
    // Immediately notify the new listener of the current status
    listener(this.isOnline);
  }

  public removeListener(listener: NetworkStatusListener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  public getServerStatus(): boolean {
    return this.isServerAvailable;
  }

  // Helper method to check if the app is installed
  public static async isAppInstalled(): Promise<boolean> {
    if ('getInstalledRelatedApps' in navigator) {
      const installedApps = await (navigator as any).getInstalledRelatedApps();
      return installedApps.length > 0;
    }
    return false;
  }
}

export const networkStatus = new NetworkStatusManager();