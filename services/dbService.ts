import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'listing-generator-db';
const DB_VERSION = 1;
const STORE_NAME = 'images';

class DBService {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }

  /**
   * Saves a single File object to the database.
   * @param file The File object to save.
   * @returns A Promise that resolves with the key of the saved file.
   */
  async saveImage(file: File): Promise<string> {
    const db = await this.dbPromise;
    const key = crypto.randomUUID();
    await db.put(STORE_NAME, file, key);
    return key;
  }
  
  /**
   * Saves an array of File objects to the database.
   * @param files An array of File objects.
   * @returns A Promise that resolves with an array of keys for the saved files.
   */
  async saveImages(files: File[]): Promise<string[]> {
    return Promise.all(files.map(file => this.saveImage(file)));
  }

  /**
   * Retrieves a single File object from the database by its key.
   * @param key The key of the file to retrieve.
   * @returns A Promise that resolves with the File object, or undefined if not found.
   */
  async getImage(key: string): Promise<File | undefined> {
    const db = await this.dbPromise;
    return db.get(STORE_NAME, key);
  }
  
  /**
   * Retrieves multiple File objects from the database by their keys.
   * @param keys An array of keys for the files to retrieve.
   * @returns A Promise that resolves with an array of File objects.
   */
  async getImages(keys: string[]): Promise<(File | undefined)[]> {
      return Promise.all(keys.map(key => this.getImage(key)));
  }

  /**
   * Deletes a single image from the database.
   * @param key The key of the image to delete.
   * @returns A Promise that resolves when the deletion is complete.
   */
  async deleteImage(key: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(STORE_NAME, key);
  }
  
  /**
   * Deletes multiple images from the database.
   * @param keys An array of keys for the images to delete.
   * @returns A Promise that resolves when all deletions are complete.
   */
  async deleteImages(keys: string[]): Promise<void> {
      const db = await this.dbPromise;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      await Promise.all([...keys.map(key => tx.store.delete(key)), tx.done]);
  }
}

// Export a singleton instance of the service
export const dbService = new DBService();
