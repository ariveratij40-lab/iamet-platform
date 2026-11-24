export function GET() {
  const indexable = import.meta.env.PUBLIC_INDEXABLE === 'true' && import.meta.env.PUBLIC_CAPTURE_ENABLED === 'true';
  const rules = indexable
    ? 'Allow: /\nSitemap: https://genetec.iamet.mx/sitemap.xml'
    : 'Disallow: /';
  return new Response('User-agent: *\n' + rules + '\n', { headers: { 'Content-Type': 'text/plain' } });
}
