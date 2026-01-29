import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import * as cheerio from "cheerio";

const serpApiKey = defineSecret("SERPAPI_KEY");

interface SearchResult {
  title: string;
  price: number | null;
  currency: string;
  imageUrl: string;
  link: string;
  storeName: string;
  snippet: string;
}

export const searchProducts = onCall(
  { secrets: [serpApiKey], cors: "*" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const { query, gl, hl, location, domain } = request.data as {
      query?: string;
      gl?: string;
      hl?: string;
      location?: string;
      domain?: string;
    };
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      throw new HttpsError("invalid-argument", "Search query is required");
    }

    const trimmedQuery = query.trim();

    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_shopping");
    url.searchParams.set("q", trimmedQuery);
    url.searchParams.set("api_key", serpApiKey.value());
    if (gl) {
      url.searchParams.set("gl", gl);
    }
    if (hl) {
      url.searchParams.set("hl", hl);
    }
    if (location) {
      url.searchParams.set("location", location);
    }
    if (domain) {
      url.searchParams.set("google_domain", domain);
    }
    const sanitizedUrl = new URL(url.toString());
    sanitizedUrl.searchParams.delete("api_key");
    logger.info("SerpAPI request", {
      query: trimmedQuery,
      gl,
      hl,
      location,
      google_domain: domain,
      url: sanitizedUrl.toString(),
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new HttpsError(
        "internal",
        `SerpAPI request failed with status ${response.status}`
      );
    }

    const data = await response.json();

    const results: SearchResult[] = (data.shopping_results || [])
      .map((item: Record<string, unknown>) => ({
        title: (item.title as string) || "",
        price: (item.extracted_price as number) ?? null,
        currency: (item.currency as string) || "USD",
        imageUrl: (item.thumbnail as string) || "",
        link: (item.link as string) || (item.product_link as string) || "",
        storeName: (item.source as string) || "",
        snippet: (item.snippet as string) || "",
      }));

    return { results };
  }
);

interface UrlMetadata {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
  price: number | null;
  currency: string | null;
}

export const fetchUrlMetadata = onCall(
  { cors: "*" },
  async (request): Promise<UrlMetadata> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const { url } = request.data as { url?: string };
    if (!url || typeof url !== "string") {
      throw new HttpsError("invalid-argument", "URL is required");
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      throw new HttpsError("invalid-argument", "Invalid URL format");
    }

    logger.info("Fetching URL metadata", { url: parsedUrl.hostname });

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "Accept-Encoding": "gzip, deflate, br",
          "Cache-Control": "max-age=0",
          Connection: "keep-alive",
          "Sec-Ch-Ua":
            '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        throw new HttpsError(
          "internal",
          `Failed to fetch URL: ${response.status}`
        );
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      logger.info("HTML fetched", {
        length: html.length,
        hasHead: $("head").length > 0,
        metaTagsCount: $("meta").length
      });

      // Log all meta tags for debugging
      const allMetaTags: Record<string, string> = {};
      $("meta").each((_, el) => {
        const $el = $(el);
        const property = $el.attr("property") || $el.attr("name") || "";
        const content = $el.attr("content") || "";
        if (property && content) {
          allMetaTags[property] = content.substring(0, 200);
        }
      });
      logger.info("All meta tags found", { metaTags: allMetaTags });

      // Extract Open Graph and meta tags
      const ogTitle =
        $('meta[property="og:title"]').attr("content") ||
        $('meta[name="og:title"]').attr("content");
      const ogDescription =
        $('meta[property="og:description"]').attr("content") ||
        $('meta[name="og:description"]').attr("content") ||
        $('meta[name="description"]').attr("content");
      const ogImage =
        $('meta[property="og:image"]').attr("content") ||
        $('meta[name="og:image"]').attr("content");
      const ogSiteName =
        $('meta[property="og:site_name"]').attr("content") ||
        $('meta[name="og:site_name"]').attr("content");

      logger.info("Extracted OG tags", { ogTitle, ogDescription, ogImage, ogSiteName });

      // Fallback to page title
      const pageTitle = $("title").text().trim();
      logger.info("Page title", { pageTitle });

      // Extract price from JSON-LD structured data
      let price: number | null = null;
      let currency: string | null = null;

      const jsonLdScripts = $('script[type="application/ld+json"]');
      logger.info("JSON-LD scripts found", { count: jsonLdScripts.length });

      jsonLdScripts.each((i, element) => {
        if (price !== null) return; // Already found price
        try {
          const jsonText = $(element).html();
          if (!jsonText) return;
          const jsonData = JSON.parse(jsonText);

          logger.info(`JSON-LD script ${i}`, {
            type: jsonData["@type"],
            hasGraph: !!jsonData["@graph"],
            keys: Object.keys(jsonData).slice(0, 10)
          });

          // Handle array of objects
          const items = Array.isArray(jsonData) ? jsonData : [jsonData];

          for (const item of items) {
            // Check for Product schema
            if (item["@type"] === "Product" && item.offers) {
              const offers = Array.isArray(item.offers)
                ? item.offers[0]
                : item.offers;
              logger.info("Found Product with offers", { offers });
              if (offers.price) {
                price = parseFloat(offers.price);
                currency = offers.priceCurrency || null;
                break;
              }
            }
            // Check for @graph structure
            if (item["@graph"]) {
              for (const graphItem of item["@graph"]) {
                if (graphItem["@type"] === "Product" && graphItem.offers) {
                  const offers = Array.isArray(graphItem.offers)
                    ? graphItem.offers[0]
                    : graphItem.offers;
                  logger.info("Found Product in @graph with offers", { offers });
                  if (offers.price) {
                    price = parseFloat(offers.price);
                    currency = offers.priceCurrency || null;
                    break;
                  }
                }
              }
            }
          }
        } catch (jsonError) {
          logger.warn(`Failed to parse JSON-LD script ${i}`, { error: String(jsonError) });
        }
      });

      // Try product:price meta tags (Facebook product schema)
      if (price === null) {
        const metaPrice = $('meta[property="product:price:amount"]').attr(
          "content"
        );
        const metaCurrency = $('meta[property="product:price:currency"]').attr(
          "content"
        );
        if (metaPrice) {
          price = parseFloat(metaPrice);
          currency = metaCurrency || null;
        }
      }

      // Derive site name from domain if not found
      const derivedSiteName =
        ogSiteName || parsedUrl.hostname.replace(/^www\./, "");

      // Make image URL absolute if relative
      let finalImageUrl = ogImage || null;

      // If no OG image, try site-specific selectors
      if (!finalImageUrl) {
        // Amazon: try #landingImage with data-old-hires or data-a-hires
        const landingImage = $("#landingImage");
        if (landingImage.length) {
          finalImageUrl =
            landingImage.attr("data-old-hires") ||
            landingImage.attr("data-a-hires") ||
            landingImage.attr("src") ||
            null;
          logger.info("Found Amazon landingImage", { finalImageUrl });
        }

        // Amazon: try other image selectors
        if (!finalImageUrl) {
          const imgWithHires = $("img[data-old-hires]").first();
          if (imgWithHires.length) {
            finalImageUrl = imgWithHires.attr("data-old-hires") || null;
            logger.info("Found img with data-old-hires", { finalImageUrl });
          }
        }

        // Amazon: try to find hiRes in JavaScript
        if (!finalImageUrl) {
          const hiResMatch = html.match(/"hiRes"\s*:\s*"([^"]+)"/);
          if (hiResMatch && hiResMatch[1]) {
            finalImageUrl = hiResMatch[1];
            logger.info("Found hiRes in JavaScript", { finalImageUrl });
          }
        }

        // Generic fallback: first large image
        if (!finalImageUrl) {
          const mainImage = $('img[src*="media-amazon.com"]').first();
          if (mainImage.length) {
            finalImageUrl = mainImage.attr("src") || null;
            logger.info("Found media-amazon.com image", { finalImageUrl });
          }
        }
      }

      if (finalImageUrl && !finalImageUrl.startsWith("http")) {
        finalImageUrl = new URL(finalImageUrl, url).toString();
      }

      const result = {
        title: ogTitle || pageTitle || null,
        description: ogDescription || null,
        imageUrl: finalImageUrl,
        siteName: derivedSiteName,
        price: price !== null && !isNaN(price) ? price : null,
        currency,
      };

      logger.info("Final metadata result", result);

      return result;
    } catch (error) {
      logger.error("Error fetching URL metadata", { error, url });
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError("internal", "Failed to fetch URL metadata");
    }
  }
);
