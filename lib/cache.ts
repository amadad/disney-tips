import fs from 'fs/promises';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_TTL = 60 * 60 * 24 * 1000; // 24 hours in ms

export async function getCachedData(key: string) {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const cacheFile = path.join(CACHE_DIR, `${key}.json`);
    
    const stats = await fs.stat(cacheFile);
    if (Date.now() - stats.mtimeMs > CACHE_TTL) {
      return null;
    }
    
    const data = await fs.readFile(cacheFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function setCachedData(key: string, data: any) {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const cacheFile = path.join(CACHE_DIR, `${key}.json`);
    await fs.writeFile(cacheFile, JSON.stringify(data));
  } catch (error) {
    console.error('Cache write failed:', error);
  }
} 