export default defineEventHandler(async (event) => {
  const { symbol } = getQuery(event);

  if (!symbol) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Stock symbol is required',
    });
  }

  try {
    // Using Yahoo Finance for better rate limits for basic price data
    const response = await $fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
    const result = response.chart.result[0];
    const meta = result.meta;

    // Try to fetch the company name separately and fail gracefully
    let companyName = 'Stock Asset';
    try {
      const quoteResponse = await $fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const quoteResult = quoteResponse.quoteResponse.result[0];
      companyName = quoteResult?.shortName || quoteResult?.longName || 'Stock Asset';
    } catch (e) {
      console.error(`Failed to fetch name for ${symbol}:`, e);
    }

    return {
      symbol: symbol.toUpperCase(),
      name: companyName,
      price: meta.regularMarketPrice,
      previousClose: meta.previousClose,
      change: meta.regularMarketPrice - meta.previousClose,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      currency: meta.currency,
    };
  } catch (error) {
    if (error.response?.status === 429) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Too many requests to the finance API. Please wait a moment.',
      });
    }
    throw createError({
      statusCode: 404,
      statusMessage: `Stock symbol ${symbol} not found`,
    });
  }
})