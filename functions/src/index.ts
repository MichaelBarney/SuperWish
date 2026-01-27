import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";

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
