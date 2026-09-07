export default defineEventHandler(async (event) => {
  const { q } = getQuery(event);
  const config = useRuntimeConfig();

  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return [];
  }

  const query = q.trim();

  try {
    const results = await $fetch<any[]>(
      `https://eodhd.com/api/search/${encodeURIComponent(query)}?api_token=${config.eodhdKey}&fmt=json`
    );

    if (!Array.isArray(results)) {
      return [];
    }

    return results.slice(0, 8).map((item) => ({
      code: item.Code,
      exchange: item.Exchange,
      symbol: `${item.Code}.${item.Exchange}`,
      name: item.Name || 'Unknown Company',
      type: item.Type || '',
      currency: item.Currency || 'USD',
    }));
  } catch (error) {
    console.error('Search API error:', error);
    return [];
  }
});
