import * as cheerio from "cheerio";
import type { ScrapedArticle } from "./types";

const BASE_URL = "https://www.cnet.com";

export async function scrapeCNET(): Promise<ScrapedArticle[]> {
  try {
    const res = await fetch(`${BASE_URL}/tech/`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
    });

    if (!res.ok) {
      console.warn("CNET fetch failed:", res.status);
      return [];
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const articles: ScrapedArticle[] = [];

    $(".c-storiesNeonHighlightsCard").each((_, el) => {
      const card = $(el);

      const linkEl = card.find(
        "a.c-storiesNeonHighlightsCard_link"
      );

      let url = linkEl.attr("href")?.trim();
      if (!url) return;

      if (!url.startsWith("http")) {
        url = `${BASE_URL}${url}`;
      }

      const title = card
        .find(".c-storiesNeonMeta_hedContent")
        .first()
        .text()
        .trim();

      const description = card
        .find(".c-storiesNeonMeta_dek")
        .first()
        .text()
        .trim();

      const author = card
        .find(".c-storiesNeonMeta_authorMeta")
        .first()
        .text()
        .trim();

      const dateText = card
        .find(".c-storiesNeonMeta_date span")
        .first()
        .text()
        .trim();

      const imageUrl =
        card.find("picture img").attr("src") ||
        card.find("picture img").attr("data-src");

      if (!title || !url) return;

      articles.push({
        title,
        description: description || undefined,
        url,
        imageUrl: imageUrl || undefined,
        category: "tech",
        source: "cnet",
        author: author || undefined,
        publishedAt: dateText
          ? new Date(dateText)
          : new Date(),
      });
    });

    return articles.slice(0, 25);
  } catch (error) {
    console.error("CNET scraping error:", error);
    return [];
  }
}
