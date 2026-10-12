import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://dotthedoor.com';
  return [
    { url: base, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/wall`, changeFrequency: 'daily', priority: .8 },
    { url: `${base}/write`, changeFrequency: 'monthly', priority: .6 },
    { url: `${base}/about`, changeFrequency: 'yearly', priority: .4 },
  ];
}
