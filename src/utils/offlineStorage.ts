// Utility for handling offline data storage and synchronization

interface StorageItem {
  id: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

class OfflineStorage {
  private readonly STORAGE_KEY = 'offline_data';

  constructor() {
    this.initStorage();
  }

  private initStorage() {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
    }
  }

  public async saveData(id: string, data: any): Promise<void> {
    try {
      const items = this.getStoredItems();
      const timestamp = Date.now();

      const existingIndex = items.findIndex(item => item.id === id);
      if (existingIndex >= 0) {
        items[existingIndex] = { id, data, timestamp, synced: false };
      } else {
        items.push({ id, data, timestamp, synced: false });
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving offline data:', error);
      throw error;
    }
  }

  public getData(id: string): any | null {
    const items = this.getStoredItems();
    const item = items.find(item => item.id === id);
    return item ? item.data : null;
  }

  public getAllUnsyncedData(): StorageItem[] {
    return this.getStoredItems().filter(item => !item.synced);
  }

  public async markAsSynced(id: string): Promise<void> {
    const items = this.getStoredItems();
    const index = items.findIndex(item => item.id === id);

    if (index >= 0) {
      items[index].synced = true;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    }
  }

  public async clearSyncedData(): Promise<void> {
    const items = this.getStoredItems().filter(item => !item.synced);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  }

  private getStoredItems(): StorageItem[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  public async syncWithServer(syncFunction: (data: any) => Promise<void>): Promise<void> {
    const unsyncedItems = this.getAllUnsyncedData();

    for (const item of unsyncedItems) {
      try {
        await syncFunction(item.data);
        await this.markAsSynced(item.id);
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error);
      }
    }

    await this.clearSyncedData();
  }
}

export const offlineStorage = new OfflineStorage();