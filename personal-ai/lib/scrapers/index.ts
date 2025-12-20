
// lib/scrapers/index.ts - UPDATED
import { scrapeTechCrunch } from './techcrunch';
import { scrapeWired } from './wired';
import { scrapeCNET } from './cnet';
import type { ScrapedArticle } from './types';

export async function scrapeAllNews(): Promise<ScrapedArticle[]> {
  console.log('Starting news scraping from all sources...');
  
  // Run all scrapers in parallel
  const results = await Promise.allSettled([
    scrapeTechCrunch(),
    scrapeWired(),
    scrapeCNET(),
  ]);
  
  const allArticles: ScrapedArticle[] = [];
  
  results.forEach((result, index) => {
    const sources = ['TechCrunch', 'Wired', 'CNET'];
    
    if (result.status === 'fulfilled') {
      console.log(`✓ ${sources[index]}: ${result.value.length} articles`);
      allArticles.push(...result.value);
    } else {
      console.error(`✗ ${sources[index]} failed:`, result.reason);
    }
  });
  
  console.log(`Total articles scraped: ${allArticles.length}`);
  return allArticles;
}

// Export individual scrapers
export { 
  scrapeTechCrunch, 
  scrapeWired,
  scrapeCNET,
};

export type { ScrapedArticle };