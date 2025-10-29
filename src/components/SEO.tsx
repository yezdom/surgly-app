import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: string;
}

export default function SEO({
  title = "Surgly.app | Dr. Surgly — The AI Ads Doctor for Smarter Advertising",
  description = "Surgly is your AI-powered Facebook Ads optimization platform. Diagnose, treat, and scale campaigns with data-driven precision.",
  canonical = "https://surgly.app",
  image = "https://surgly.app/meta-preview.jpg",
  type = "website"
}: SEOProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Surgly",
    "alternateName": "Dr. Surgly — The AI Ads Doctor",
    "url": "https://surgly.app",
    "logo": "https://surgly.app/meta-preview.jpg",
    "image": "https://surgly.app/meta-preview.jpg",
    "applicationCategory": "MarketingAutomationSoftware",
    "operatingSystem": "Web",
    "description": "Surgly is an AI-powered Facebook Ads optimization platform that diagnoses, treats, and scales your ad campaigns automatically.",
    "creator": {
      "@type": "Organization",
      "name": "Surgly",
      "url": "https://surgly.app"
    },
    "offers": {
      "@type": "Offer",
      "price": "29.00",
      "priceCurrency": "GBP",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "187"
    },
    "sameAs": [
      "https://twitter.com/surglyapp",
      "https://www.linkedin.com/company/surglyapp",
      "https://www.instagram.com/surglyapp"
    ]
  };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      <meta name="keywords" content="AI ads optimization, Facebook marketing AI, campaign analytics, ad reports, ad performance, ad doctor, Facebook ads, TikTok ads, Google ads, ad optimization tools" />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Surgly" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@surglyapp" />
      <meta name="twitter:creator" content="@surglyapp" />

      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="Surgly" />

      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
