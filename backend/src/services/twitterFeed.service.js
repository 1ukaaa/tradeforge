// backend/src/services/twitterFeed.service.js
// MacroLens — Récupère les tweets via Nitter RSS (alternative gratuite & sans API)
// Nitter est un frontend Twitter open-source qui expose des flux RSS publics

const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const _cache = {};

// Instances Nitter publiques (ordre de priorité)
const NITTER_INSTANCES = [
  'https://nitter.net',
  'https://nitter.privacydev.net',
  'https://nitter.poast.org',
];

// ─── XML Parser ───────────────────────────────────────────────────────────────

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['item'].includes(name),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cleanText = (text) => {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '')       // strip HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/https:\/\/t\.co\/\S+/g, '')  // strip t.co URLs from display text
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const parseDate = (dateStr) => {
  try { return new Date(dateStr).toISOString(); } catch { return new Date().toISOString(); }
};

// ─── Fetch via Nitter RSS ────────────────────────────────────────────────────

const fetchFromInstance = async (instance, handle) => {
  const url = `${instance}/${handle}/rss`;
  const { data } = await axios.get(url, {
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TradeForge/1.0; +https://tradeforge.app)',
      'Accept': 'application/rss+xml, application/xml, text/xml',
    },
  });
  return data;
};

const fetchTweets = async (handle, count = 30) => {
  const now = Date.now();
  const cached = _cache[handle];
  if (cached && (now - cached.fetchedAt) < CACHE_TTL_MS) {
    return { ...cached, fromCache: true };
  }

  console.log(`[TwitterFeed] Fetch Nitter RSS @${handle}...`);

  let rawXml = null;
  let usedInstance = null;

  for (const instance of NITTER_INSTANCES) {
    try {
      rawXml = await fetchFromInstance(instance, handle);
      usedInstance = instance;
      break;
    } catch (e) {
      console.warn(`[TwitterFeed] Instance ${instance} KO: ${e.message}`);
    }
  }

  if (!rawXml) throw new Error('Toutes les instances Nitter sont indisponibles');

  const parsed = parser.parse(rawXml);
  const channel = parsed?.rss?.channel || {};
  const items = channel.item || [];

  // Parse channel info as "user"
  const user = {
    name: cleanText(channel.title?.replace(/\/ Twitter$/, '').replace(/- Nitter$/, '').trim() || handle),
    username: handle,
    profile_image_url: channel.image?.url || null,
    description: cleanText(channel.description || ''),
    link: `https://twitter.com/${handle}`,
  };

  const tweets = items.slice(0, count).map(item => {
    const rawTitle = item.title || '';
    const rawDesc  = item.description || '';
    const link     = item.link || item.guid || '';
    const pubDate  = item['pubDate'] || item['dc:date'] || '';
    const idMatch  = link.match(/\/status\/(\d+)/);

    // Use description if it has more content than title
    const textRaw  = rawDesc.length > rawTitle.length ? rawDesc : rawTitle;

    return {
      id: idMatch?.[1] || String(Date.now()),
      text: cleanText(textRaw),
      created_at: parseDate(pubDate),
      url: link.includes('nitter')
        ? link.replace(/https?:\/\/[^/]+/, 'https://twitter.com')
        : link,
      metrics: { like_count: 0, retweet_count: 0, reply_count: 0 },
    };
  });

  const result = {
    tweets,
    user,
    handle,
    source: usedInstance,
    fetchedAt: now,
    fetchedAtIso: new Date(now).toISOString(),
    fromCache: false,
  };

  _cache[handle] = result;
  console.log(`[TwitterFeed] ✅ @${handle} — ${tweets.length} tweets via ${usedInstance}`);
  return result;
};

const invalidateCache = (handle) => { delete _cache[handle]; };

module.exports = { fetchTweets, invalidateCache };
