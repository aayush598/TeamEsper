import { scrapeTechCrunch } from './techcrunch';
import { scrapeWired } from './wired';
import type { ScrapedArticle } from './types';

export async function scrapeAllNews(): Promise<ScrapedArticle[]> {
  const [techCrunchArticles, wiredArticles] = await Promise.all([
    scrapeTechCrunch(),
    scrapeWired(),
  ]);
  
  return [...techCrunchArticles, ...wiredArticles];
}

export { scrapeTechCrunch, scrapeWired };
export type { ScrapedArticle };
