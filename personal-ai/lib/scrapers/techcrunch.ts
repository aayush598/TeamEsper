import * as cheerio from 'cheerio';

export async function scrapeTechCrunch(): Promise<ScrapedArticle[]> {
  try {
    const response = await fetch('https://techcrunch.com/latest/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`TechCrunch fetch failed: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const articles: ScrapedArticle[] = [];
    
    $('article.post-block').each((_, element) => {
      const $article = $(element);
      
      const title = $article.find('h2.post-block__title a').text().trim();
      const url = $article.find('h2.post-block__title a').attr('href') || '';
      const description = $article.find('.post-block__content').text().trim();
      const imageUrl = $article.find('img').attr('src');
      const author = $article.find('.river-byline__authors a').first().text().trim();
      
      if (title && url) {
        articles.push({
          title,
          description,
          url,
          imageUrl,
          category: 'tech',
          source: 'techcrunch',
          author: author || undefined,
          publishedAt: new Date(),
        });
      }
    });
    
    return articles.slice(0, 50);
  } catch (error) {
    console.error('TechCrunch scraping error:', error);
    return [];
  }
}