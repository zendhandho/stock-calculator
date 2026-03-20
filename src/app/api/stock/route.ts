import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
  }

  try {
    const quote: any = await yahooFinance.quote(ticker.toUpperCase());
    const summaryResult: any = await yahooFinance.quoteSummary(ticker.toUpperCase(), {
      modules: [
        "summaryDetail",
        "financialData",
        "defaultKeyStatistics",
        "earningsTrend",
        "incomeStatementHistory",
      ],
    });

    const summary = summaryResult.summaryDetail;
    const financial = summaryResult.financialData;
    const keyStats = summaryResult.defaultKeyStatistics;
    const income = summaryResult.incomeStatementHistory;

    // Extract revenue trend (last 3-4 annual periods)
    const revenueHistory = income?.incomeStatementHistory?.map((stmt: any) => ({
      date: stmt.endDate?.toISOString().split("T")[0] ?? "N/A",
      revenue: stmt.totalRevenue ?? 0,
      netIncome: stmt.netIncome ?? 0,
    })) ?? [];

    const stockData = {
      // Identity
      symbol: quote.symbol,
      shortName: quote.shortName ?? quote.longName ?? ticker,
      exchange: quote.fullExchangeName ?? quote.exchange,
      sector: quote.sector ?? "N/A",

      // Price
      currentPrice: quote.regularMarketPrice ?? 0,
      previousClose: quote.regularMarketPreviousClose ?? 0,
      changePercent: quote.regularMarketChangePercent ?? 0,
      currency: quote.currency ?? "USD",

      // Valuation
      marketCap: quote.marketCap ?? 0,
      trailingPE: summary?.trailingPE ?? quote.trailingPE ?? null,
      forwardPE: summary?.forwardPE ?? quote.forwardPE ?? null,
      pegRatio: keyStats?.pegRatio ?? null,
      priceToBook: keyStats?.priceToBook ?? summary?.priceToBook ?? null,
      enterpriseToEbitda: keyStats?.enterpriseToEbitda ?? null,

      // Ranges
      fiftyTwoWeekHigh: summary?.fiftyTwoWeekHigh ?? quote.fiftyTwoWeekHigh ?? 0,
      fiftyTwoWeekLow: summary?.fiftyTwoWeekLow ?? quote.fiftyTwoWeekLow ?? 0,
      fiftyDayAverage: summary?.fiftyDayAverage ?? quote.fiftyDayAverage ?? 0,
      twoHundredDayAverage: summary?.twoHundredDayAverage ?? quote.twoHundredDayAverage ?? 0,

      // Dividends
      dividendYield: summary?.dividendYield ?? quote.dividendYield ?? 0,
      dividendRate: summary?.dividendRate ?? 0,
      payoutRatio: summary?.payoutRatio ?? null,

      // Financial Health
      totalDebt: financial?.totalDebt ?? null,
      totalCash: financial?.totalCash ?? null,
      debtToEquity: financial?.debtToEquity ?? null,
      currentRatio: financial?.currentRatio ?? null,
      returnOnEquity: financial?.returnOnEquity ?? null,
      returnOnAssets: financial?.returnOnAssets ?? null,
      grossMargins: financial?.grossMargins ?? null,
      operatingMargins: financial?.operatingMargins ?? null,
      profitMargins: financial?.profitMargins ?? null,
      freeCashflow: financial?.freeCashflow ?? null,
      revenueGrowth: financial?.revenueGrowth ?? null,
      earningsGrowth: financial?.earningsGrowth ?? null,

      // Key Stats
      beta: keyStats?.beta ?? quote.beta ?? null,
      sharesOutstanding: keyStats?.sharesOutstanding ?? quote.sharesOutstanding ?? null,
      shortPercentOfFloat: keyStats?.shortPercentOfFloat ?? null,

      // Revenue History (for trend analysis)
      revenueHistory,

      // Volume
      volume: quote.regularMarketVolume ?? 0,
      averageVolume: quote.averageDailyVolume3Month ?? 0,
    };

    return NextResponse.json(stockData);
  } catch (error: any) {
    console.error("Yahoo Finance error:", error);
    return NextResponse.json(
      { error: `Could not fetch data for ticker "${ticker}". Check if it's valid.` },
      { status: 404 }
    );
  }
}
