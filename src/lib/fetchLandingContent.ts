export interface LandingPageExtraction {
  fullText: string;
  title: string;
  h1: string;
  metaDescription: string;
  headings: string[];
  summary: string;
}

export async function fetchLandingContent(url: string): Promise<LandingPageExtraction> {
  try {
    // In production, this should go through a CORS proxy or backend service
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Extract structured metadata
    const title = extractTag(html, 'title') || '';
    const h1 = extractTag(html, 'h1') || '';
    const metaDescription = extractMetaTag(html, 'description') || '';

    // Extract all headings for structure
    const headings = extractAllHeadings(html);

    // Clean and extract visible text content
    const cleanText = cleanHTML(html);

    // Create comprehensive summary
    const summaryParts = [
      title && `Title: ${title}`,
      h1 && `Main Heading: ${h1}`,
      metaDescription && `Description: ${metaDescription}`,
      headings.length > 0 && `Key Points:\n${headings.slice(0, 10).map(h => `- ${h}`).join('\n')}`,
      `\nVisible Content:\n${cleanText.slice(0, 4000)}`,
    ].filter(Boolean);

    const summary = summaryParts.join('\n\n');

    console.log('✅ Fetched landing content length:', summary.length);
    console.log('📊 Extracted:', { title, h1, headingsCount: headings.length });

    return {
      fullText: cleanText,
      title,
      h1,
      metaDescription,
      headings,
      summary,
    };
  } catch (error) {
    console.error('❌ Error fetching landing page:', error);

    // Return empty extraction on error
    return {
      fullText: 'Unable to extract readable content.',
      title: '',
      h1: '',
      metaDescription: '',
      headings: [],
      summary: 'Unable to extract readable content. Please check the URL and try again.',
    };
  }
}

function extractTag(html: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = html.match(regex);
  return match ? cleanTagContent(match[1]) : '';
}

function extractMetaTag(html: string, name: string): string {
  const regex = new RegExp(
    `<meta\\s+(?:name|property)=["'](?:${name}|og:${name})["']\\s+content=["']([^"']*)["']`,
    'i'
  );
  const match = html.match(regex);
  return match ? match[1] : '';
}

function extractAllHeadings(html: string): string[] {
  const headings: string[] = [];

  // Extract h2, h3, h4 headings
  const headingRegex = /<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi;
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    const heading = cleanTagContent(match[1]);
    if (heading && heading.length > 3 && heading.length < 200) {
      headings.push(heading);
    }
  }

  return headings;
}

function cleanTagContent(content: string): string {
  return content
    .replace(/<[^>]+>/g, ' ') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanHTML(html: string): string {
  let cleaned = html;

  // Remove script tags and their content
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Remove style tags and their content
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Remove comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // Remove common non-visible elements
  cleaned = cleaned.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
  cleaned = cleaned.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');

  // Remove SVG content (often decorative)
  cleaned = cleaned.replace(/<svg[\s\S]*?<\/svg>/gi, '');

  // Extract specific high-value elements before general cleaning
  const ratings = extractRatings(html);
  const prices = extractPrices(html);
  const testimonials = extractTestimonials(html);
  const ctaButtons = extractCTAButtons(html);

  // Remove all remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');

  // Normalize whitespace
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  // Prepend extracted structured data
  const structuredInfo = [
    ratings.length > 0 && `Ratings/Reviews: ${ratings.join(', ')}`,
    prices.length > 0 && `Pricing: ${prices.join(', ')}`,
    ctaButtons.length > 0 && `Call-to-Actions: ${ctaButtons.join(', ')}`,
    testimonials.length > 0 && `Testimonials: ${testimonials.slice(0, 2).join(' | ')}`,
  ].filter(Boolean).join('\n');

  if (structuredInfo) {
    cleaned = `${structuredInfo}\n\n${cleaned}`;
  }

  return cleaned;
}

function extractRatings(html: string): string[] {
  const ratings: string[] = [];

  // Look for common rating patterns
  const ratingPatterns = [
    /(\d+\.?\d*)\s*(?:\/|out of)\s*5\s*(?:stars?)?/gi,
    /rated\s+(\d+\.?\d*)/gi,
    /(\d+\.?\d*)\s*stars?/gi,
    /⭐+\s*(\d+\.?\d*)/gi,
  ];

  ratingPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      ratings.push(match[0].trim());
    }
  });

  // Look for review counts
  const reviewPattern = /(\d{1,3}(?:,\d{3})*)\s*(?:\+)?\s*(?:reviews?|customers?|verified)/gi;
  let match;
  while ((match = reviewPattern.exec(html)) !== null) {
    ratings.push(match[0].trim());
  }

  return [...new Set(ratings)].slice(0, 5);
}

function extractPrices(html: string): string[] {
  const prices: string[] = [];

  // Look for price patterns
  const pricePatterns = [
    /\$\d+(?:\.\d{2})?/g,
    /£\d+(?:\.\d{2})?/g,
    /€\d+(?:\.\d{2})?/g,
    /save\s+\d+%/gi,
    /\d+%\s+off/gi,
  ];

  pricePatterns.forEach(pattern => {
    const matches = html.match(pattern);
    if (matches) {
      prices.push(...matches);
    }
  });

  return [...new Set(prices)].slice(0, 10);
}

function extractTestimonials(html: string): string[] {
  const testimonials: string[] = [];

  // Look for quoted text or testimonial patterns
  const testimonialPattern = /"([^"]{20,200})"/g;
  let match;

  while ((match = testimonialPattern.exec(html)) !== null) {
    const text = cleanTagContent(match[1]);
    if (text.length > 20 && text.length < 200) {
      testimonials.push(text);
    }
  }

  return testimonials.slice(0, 5);
}

function extractCTAButtons(html: string): string[] {
  const ctas: string[] = [];

  // Look for button text
  const buttonPattern = /<button[^>]*>([^<]+)<\/button>/gi;
  let match;

  while ((match = buttonPattern.exec(html)) !== null) {
    const text = cleanTagContent(match[1]);
    if (text && text.length < 50) {
      ctas.push(text);
    }
  }

  // Look for link text that might be CTAs
  const linkPattern = /<a[^>]*class=["'][^"']*(?:btn|button|cta)[^"']*["'][^>]*>([^<]+)<\/a>/gi;

  while ((match = linkPattern.exec(html)) !== null) {
    const text = cleanTagContent(match[1]);
    if (text && text.length < 50) {
      ctas.push(text);
    }
  }

  return [...new Set(ctas)].slice(0, 5);
}
