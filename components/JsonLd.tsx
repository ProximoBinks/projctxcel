/**
 * Inject JSON-LD structured data into the page <head>.
 *
 * Usage:
 *   <JsonLd data={organizationSchema} />
 *
 * Can be used multiple times on the same page for different schema types.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
