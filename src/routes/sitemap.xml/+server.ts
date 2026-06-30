import type { RequestHandler } from "./$types";

// TODO: set the production origin here (no trailing slash) once a domain exists.
const SITE = "https://example.com";

// Public, indexable routes only — never list admin/account/login here.
const PAGES = ["/"];

export const GET: RequestHandler = () => {
  const urls = PAGES.map(
    (path) => `  <url>
    <loc>${SITE}${path}</loc>
    <changefreq>weekly</changefreq>
  </url>`
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "max-age=3600"
    }
  });
};
