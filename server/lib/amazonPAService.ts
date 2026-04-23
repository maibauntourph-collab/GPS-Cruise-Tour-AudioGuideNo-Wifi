/**
 * Amazon Product Advertising API 5.0
 * 여행 관련 Amazon 상품 검색 및 어필리에이트 링크 생성
 * Uses globalThis.crypto.subtle for SigV4 — Cloudflare Workers compatible
 * API Docs: https://webservices.amazon.com/paapi5/documentation/
 */

import { getEnv } from '../env';

export const TRAVEL_KEYWORDS = [
  'luggage carry on',
  'travel adapter universal',
  'passport holder wallet',
  'packing cubes set',
  'neck pillow travel',
  'travel umbrella compact',
  'portable charger travel',
  'noise cancelling earbuds travel',
  'travel toiletry bag',
  'money belt travel',
];

function getConfig() {
  return {
    accessKeyId:     getEnv('AMAZON_PA_ACCESS_KEY_ID') || '',
    secretAccessKey: getEnv('AMAZON_PA_SECRET_ACCESS_KEY') || '',
    partnerTag:      getEnv('AMAZON_PA_PARTNER_TAG') || '',
    region:          'us-east-1',
    host:            'webservices.amazon.com',
    marketplace:     'www.amazon.com',
  };
}

export interface AmazonProduct {
  asin: string;
  title: string;
  imageUrl: string;
  price: number | null;
  currency: string;
  rating: number | null;
  reviewCount: number | null;
  affiliateUrl: string;
}

// ── AWS SigV4 helpers (Web Crypto API — no node:crypto) ────────────────

async function hmacSHA256(key: ArrayBuffer | string, data: string): Promise<ArrayBuffer> {
  const keyData = typeof key === 'string'
    ? new TextEncoder().encode(key)
    : new Uint8Array(key);
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return globalThis.crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
}

async function sha256Hex(data: string): Promise<string> {
  const buf = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function buildSigV4Headers(
  method: string, host: string, path: string,
  region: string, service: string,
  accessKeyId: string, secretAccessKey: string,
  payload: string
): Promise<Record<string, string>> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = await sha256Hex(payload);

  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:application/json; charset=UTF-8\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems\n`;

  const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';

  const canonicalRequest = [method, path, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, await sha256Hex(canonicalRequest)].join('\n');

  const kDate    = await hmacSHA256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion  = await hmacSHA256(kDate, region);
  const kService = await hmacSHA256(kRegion, service);
  const kSigning = await hmacSHA256(kService, 'aws4_request');
  const signature = bufToHex(await hmacSHA256(kSigning, stringToSign));

  return {
    'Authorization': `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    'Content-Encoding': 'amz-1.0',
    'Content-Type': 'application/json; charset=UTF-8',
    'Host': host,
    'X-Amz-Date': amzDate,
    'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
  };
}

export async function searchTravelProducts(
  keyword: string,
  count: number = 6
): Promise<AmazonProduct[]> {
  const { accessKeyId, secretAccessKey, partnerTag, region, host, marketplace } = getConfig();
  if (!accessKeyId || !secretAccessKey || !partnerTag) {
    throw new Error('Amazon PA API credentials not configured');
  }

  const path = '/paapi5/searchitems';
  const payload = JSON.stringify({
    Keywords: keyword,
    Resources: [
      'Images.Primary.Medium',
      'ItemInfo.Title',
      'Offers.Listings.Price',
      'CustomerReviews.Count',
      'CustomerReviews.StarRating',
    ],
    PartnerTag: partnerTag,
    PartnerType: 'Associates',
    Marketplace: marketplace,
    ItemCount: Math.min(count, 10),
    SearchIndex: 'Luggage',
  });

  const headers = await buildSigV4Headers(
    'POST', host, path, region, 'ProductAdvertisingAPI',
    accessKeyId, secretAccessKey, payload
  );

  const response = await fetch(`https://${host}${path}`, { method: 'POST', headers, body: payload });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Amazon PA API error ${response.status}: ${errorText}`);
  }

  const data: any = await response.json();
  return (data.SearchResult?.Items || []).map((item: any) => {
    const listing = item.Offers?.Listings?.[0];
    return {
      asin: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue || '',
      imageUrl: item.Images?.Primary?.Medium?.URL || '',
      price: listing?.Price?.Amount ?? null,
      currency: listing?.Price?.Currency ?? 'USD',
      rating: item.CustomerReviews?.StarRating?.Value ?? null,
      reviewCount: item.CustomerReviews?.Count ?? null,
      affiliateUrl: `https://www.amazon.com/dp/${item.ASIN}?tag=${partnerTag}`,
    };
  });
}
