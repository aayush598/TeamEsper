import * as cheerio from 'cheerio';

export async function scrapeWired(): Promise<ScrapedArticle[]> {
  try {
    const response = await fetch('https://www.wired.com/tag/technology/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Wired fetch failed: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const articles: ScrapedArticle[] = [];
    
    $('div.summary-item').each((_, element) => {
      const $article = $(element);
      
      const title = $article.find('h3.summary-item__hed').text().trim();
      const url = $article.find('a.summary-item__hed-link').attr('href');
      const description = $article.find('.summary-item__dek').text().trim();
      const imageUrl = $article.find('img').attr('src');
      const author = $article.find('.summary-item__byline').text().trim();
      
      const fullUrl = url?.startsWith('http') ? url : `https://www.wired.com${url}`;
      
      if (title && url) {
        articles.push({
          title,
          description,
          url: fullUrl,
          imageUrl,
          category: 'tech',
          source: 'wired',
          author: author || undefined,
          publishedAt: new Date(),
        });
      }
    });
    
    return articles.slice(0, 50);
  } catch (error) {
    console.error('Wired scraping error:', error);
    return [];
  }
}