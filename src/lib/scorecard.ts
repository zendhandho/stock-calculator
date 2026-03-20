export interface StockData {
  symbol: string;
  shortName: string;
  exchange: string;
  sector: string;
  currentPrice: number;
  previousClose: number;
  changePercent: number;
  currency: string;
  marketCap: number;
  trailingPE: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  priceToBook: number | null;
  enterpriseToEbitda: number | null;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  fiftyDayAverage: number;
  twoHundredDayAverage: number;
  dividendYield: number;
  dividendRate: number;
  payoutRatio: number | null;
  totalDebt: number | null;
  totalCash: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  grossMargins: number | null;
  operatingMargins: number | null;
  profitMargins: number | null;
  freeCashflow: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  beta: number | null;
  sharesOutstanding: number | null;
  shortPercentOfFloat: number | null;
  revenueHistory: { date: string; revenue: number; netIncome: number }[];
  volume: number;
  averageVolume: number;
}

export interface ScoreCategory {
  name: string;
  score: number;
  maxScore: number;
  reasoning: string;
}

export interface ScorecardResult {
  totalScore: number;
  maxScore: number;
  conviction: "Low" | "Medium" | "High" | "Very High";
  categories: ScoreCategory[];
}

export interface BullBearResult {
  bullPoints: string[];
  bearPoints: string[];
}

// ── Zen Dhandho Scorecard ──────────────────────────────────────────────
// Each category scored 1-10, total out of 50

function scoreValuation(data: StockData): ScoreCategory {
  let score = 5; // default neutral
  const reasons: string[] = [];

  // P/E scoring
  if (data.trailingPE !== null) {
    if (data.trailingPE < 10) { score += 2; reasons.push(`Low P/E of ${data.trailingPE.toFixed(1)} suggests undervaluation`); }
    else if (data.trailingPE < 15) { score += 1; reasons.push(`Reasonable P/E of ${data.trailingPE.toFixed(1)}`); }
    else if (data.trailingPE > 30) { score -= 2; reasons.push(`High P/E of ${data.trailingPE.toFixed(1)} signals overvaluation risk`); }
    else if (data.trailingPE > 25) { score -= 1; reasons.push(`Elevated P/E of ${data.trailingPE.toFixed(1)}`); }
  }

  // PEG ratio (growth-adjusted value)
  if (data.pegRatio !== null) {
    if (data.pegRatio < 1) { score += 1; reasons.push(`PEG under 1 (${data.pegRatio.toFixed(2)}) — growth at a discount`); }
    else if (data.pegRatio > 2) { score -= 1; reasons.push(`PEG over 2 (${data.pegRatio.toFixed(2)}) — pricey for the growth`); }
  }

  // Price to Book
  if (data.priceToBook !== null) {
    if (data.priceToBook < 1.5) { score += 1; reasons.push(`Price/Book of ${data.priceToBook.toFixed(2)} is attractive`); }
    else if (data.priceToBook > 5) { score -= 1; reasons.push(`Price/Book of ${data.priceToBook.toFixed(2)} is stretched`); }
  }

  // 52-week position (closer to low = more attractive)
  const range = data.fiftyTwoWeekHigh - data.fiftyTwoWeekLow;
  if (range > 0) {
    const position = (data.currentPrice - data.fiftyTwoWeekLow) / range;
    if (position < 0.3) { score += 1; reasons.push(`Trading near 52-week low (${(position * 100).toFixed(0)}% of range)`); }
    else if (position > 0.9) { score -= 1; reasons.push(`Near 52-week high (${(position * 100).toFixed(0)}% of range)`); }
  }

  return { name: "Valuation", score: clamp(score, 1, 10), maxScore: 10, reasoning: reasons.join(". ") || "Insufficient data for detailed valuation." };
}

function scoreMoat(data: StockData): ScoreCategory {
  let score = 5;
  const reasons: string[] = [];

  // Gross margins as moat proxy
  if (data.grossMargins !== null) {
    const gm = data.grossMargins * 100;
    if (gm > 60) { score += 2; reasons.push(`Strong gross margins (${gm.toFixed(1)}%) suggest pricing power`); }
    else if (gm > 40) { score += 1; reasons.push(`Solid gross margins (${gm.toFixed(1)}%)`); }
    else if (gm < 20) { score -= 2; reasons.push(`Thin gross margins (${gm.toFixed(1)}%) — weak pricing power`); }
  }

  // Operating margins
  if (data.operatingMargins !== null) {
    const om = data.operatingMargins * 100;
    if (om > 25) { score += 1; reasons.push(`High operating margins (${om.toFixed(1)}%) show efficiency`); }
    else if (om < 5) { score -= 1; reasons.push(`Low operating margins (${om.toFixed(1)}%)`); }
  }

  // Return on equity (durable advantage)
  if (data.returnOnEquity !== null) {
    const roe = data.returnOnEquity * 100;
    if (roe > 20) { score += 1; reasons.push(`ROE of ${roe.toFixed(1)}% signals competitive advantage`); }
    else if (roe < 5) { score -= 1; reasons.push(`Low ROE of ${roe.toFixed(1)}%`); }
  }

  // Market cap as stability proxy
  if (data.marketCap > 100_000_000_000) { score += 1; reasons.push("Large-cap stability"); }
  else if (data.marketCap < 1_000_000_000) { score -= 1; reasons.push("Small-cap — higher risk, narrower moat"); }

  return { name: "Moat", score: clamp(score, 1, 10), maxScore: 10, reasoning: reasons.join(". ") || "Limited moat data available." };
}

function scoreBalanceSheet(data: StockData): ScoreCategory {
  let score = 5;
  const reasons: string[] = [];

  // Debt to equity
  if (data.debtToEquity !== null) {
    if (data.debtToEquity < 30) { score += 2; reasons.push(`Very low debt/equity (${data.debtToEquity.toFixed(1)})`); }
    else if (data.debtToEquity < 80) { score += 1; reasons.push(`Manageable debt/equity (${data.debtToEquity.toFixed(1)})`); }
    else if (data.debtToEquity > 200) { score -= 2; reasons.push(`Heavy debt load (D/E ${data.debtToEquity.toFixed(1)})`); }
    else if (data.debtToEquity > 100) { score -= 1; reasons.push(`Elevated debt (D/E ${data.debtToEquity.toFixed(1)})`); }
  }

  // Current ratio
  if (data.currentRatio !== null) {
    if (data.currentRatio > 2) { score += 1; reasons.push(`Strong current ratio (${data.currentRatio.toFixed(2)}) — ample liquidity`); }
    else if (data.currentRatio < 1) { score -= 2; reasons.push(`Current ratio under 1 (${data.currentRatio.toFixed(2)}) — liquidity concern`); }
  }

  // Cash vs Debt
  if (data.totalCash !== null && data.totalDebt !== null && data.totalDebt > 0) {
    const cashToDebt = data.totalCash / data.totalDebt;
    if (cashToDebt > 1) { score += 1; reasons.push("More cash than debt on hand"); }
    else if (cashToDebt < 0.2) { score -= 1; reasons.push("Cash covers less than 20% of debt"); }
  }

  // Free cash flow
  if (data.freeCashflow !== null) {
    if (data.freeCashflow > 0) { score += 1; reasons.push(`Positive free cash flow ($${formatLargeNumber(data.freeCashflow)})`); }
    else { score -= 1; reasons.push("Negative free cash flow"); }
  }

  return { name: "Balance Sheet", score: clamp(score, 1, 10), maxScore: 10, reasoning: reasons.join(". ") || "Limited balance sheet data." };
}

function scoreBehavioral(data: StockData): ScoreCategory {
  let score = 5;
  const reasons: string[] = [];

  // Beta (volatility / market sentiment proxy)
  if (data.beta !== null) {
    if (data.beta < 0.8) { score += 1; reasons.push(`Low beta (${data.beta.toFixed(2)}) — less volatile than the market`); }
    else if (data.beta > 1.5) { score -= 1; reasons.push(`High beta (${data.beta.toFixed(2)}) — more volatile, sentiment-driven`); }
  }

  // Short interest
  if (data.shortPercentOfFloat !== null) {
    const sp = data.shortPercentOfFloat * 100;
    if (sp > 20) { score -= 2; reasons.push(`Heavy short interest (${sp.toFixed(1)}%) — bears are betting against it`); }
    else if (sp > 10) { score -= 1; reasons.push(`Notable short interest (${sp.toFixed(1)}%)`); }
    else if (sp < 3) { score += 1; reasons.push(`Minimal short interest (${sp.toFixed(1)}%) — low bearish sentiment`); }
  }

  // Price vs moving averages (trend / herd behavior)
  if (data.fiftyDayAverage > 0 && data.twoHundredDayAverage > 0) {
    const aboveFifty = data.currentPrice > data.fiftyDayAverage;
    const aboveTwoHundred = data.currentPrice > data.twoHundredDayAverage;

    if (aboveFifty && aboveTwoHundred) {
      score += 1;
      reasons.push("Trading above both 50-day and 200-day averages — positive momentum");
    } else if (!aboveFifty && !aboveTwoHundred) {
      // Could be oversold (contrarian opportunity) or deservedly down
      reasons.push("Below both moving averages — could be oversold or in decline");
    }
  }

  // Volume spike (unusual activity)
  if (data.averageVolume > 0) {
    const volumeRatio = data.volume / data.averageVolume;
    if (volumeRatio > 2) { reasons.push(`Volume is ${volumeRatio.toFixed(1)}x average — unusual activity`); }
  }

  return { name: "Behavioral Factors", score: clamp(score, 1, 10), maxScore: 10, reasoning: reasons.join(". ") || "Neutral behavioral signals." };
}

function scoreMarginOfSafety(data: StockData): ScoreCategory {
  let score = 5;
  const reasons: string[] = [];

  // Discount from 52-week high
  if (data.fiftyTwoWeekHigh > 0) {
    const discount = ((data.fiftyTwoWeekHigh - data.currentPrice) / data.fiftyTwoWeekHigh) * 100;
    if (discount > 30) { score += 2; reasons.push(`${discount.toFixed(0)}% below 52-week high — significant margin of safety`); }
    else if (discount > 15) { score += 1; reasons.push(`${discount.toFixed(0)}% below 52-week high — some margin`); }
    else if (discount < 5) { score -= 1; reasons.push(`Only ${discount.toFixed(0)}% from 52-week high — tight margin`); }
  }

  // Dividend as downside cushion
  if (data.dividendYield > 0) {
    const dy = data.dividendYield * 100;
    if (dy > 4) { score += 1; reasons.push(`${dy.toFixed(2)}% dividend yield provides income cushion`); }
    else if (dy > 2) { reasons.push(`${dy.toFixed(2)}% dividend yield adds mild cushion`); }
  }

  // Earnings growth trajectory
  if (data.earningsGrowth !== null) {
    const eg = data.earningsGrowth * 100;
    if (eg > 15) { score += 1; reasons.push(`Earnings growing ${eg.toFixed(1)}% — growth protects downside`); }
    else if (eg < -10) { score -= 1; reasons.push(`Earnings declining ${eg.toFixed(1)}% — eroding safety`); }
  }

  // Revenue trend
  if (data.revenueHistory.length >= 2) {
    const recent = data.revenueHistory[0]?.revenue ?? 0;
    const prior = data.revenueHistory[1]?.revenue ?? 0;
    if (prior > 0 && recent > 0) {
      const revChange = ((recent - prior) / prior) * 100;
      if (revChange > 10) { score += 1; reasons.push(`Revenue growing year-over-year (${revChange.toFixed(1)}%)`); }
      else if (revChange < -10) { score -= 1; reasons.push(`Revenue declining year-over-year (${revChange.toFixed(1)}%)`); }
    }
  }

  return { name: "Margin of Safety", score: clamp(score, 1, 10), maxScore: 10, reasoning: reasons.join(". ") || "Insufficient data to assess margin of safety." };
}

export function calculateScorecard(data: StockData): ScorecardResult {
  const categories = [
    scoreValuation(data),
    scoreMoat(data),
    scoreBalanceSheet(data),
    scoreBehavioral(data),
    scoreMarginOfSafety(data),
  ];

  const totalScore = categories.reduce((sum, cat) => sum + cat.score, 0);

  let conviction: ScorecardResult["conviction"];
  if (totalScore >= 40) conviction = "Very High";
  else if (totalScore >= 30) conviction = "High";
  else if (totalScore >= 20) conviction = "Medium";
  else conviction = "Low";

  return { totalScore, maxScore: 50, conviction, categories };
}

// ── Bull & Bear Analysis ───────────────────────────────────────────────

export function generateBullBear(data: StockData): BullBearResult {
  const bullPoints: string[] = [];
  const bearPoints: string[] = [];

  // Valuation
  if (data.trailingPE !== null) {
    if (data.trailingPE < 15) bullPoints.push(`Attractive valuation with a P/E of ${data.trailingPE.toFixed(1)} — market may be underpricing this business`);
    else if (data.trailingPE > 25) bearPoints.push(`P/E of ${data.trailingPE.toFixed(1)} prices in a lot of optimism — risk of multiple compression`);
  }

  if (data.pegRatio !== null && data.pegRatio < 1) {
    bullPoints.push(`PEG ratio of ${data.pegRatio.toFixed(2)} means you're getting growth at a discount`);
  } else if (data.pegRatio !== null && data.pegRatio > 2) {
    bearPoints.push(`PEG of ${data.pegRatio.toFixed(2)} — paying a premium for the growth story`);
  }

  // Margins & Moat
  if (data.grossMargins !== null && data.grossMargins > 0.5) {
    bullPoints.push(`Gross margins of ${(data.grossMargins * 100).toFixed(1)}% indicate strong pricing power and a durable competitive position`);
  } else if (data.grossMargins !== null && data.grossMargins < 0.25) {
    bearPoints.push(`Thin gross margins (${(data.grossMargins * 100).toFixed(1)}%) leave little room for error`);
  }

  if (data.returnOnEquity !== null && data.returnOnEquity > 0.2) {
    bullPoints.push(`ROE of ${(data.returnOnEquity * 100).toFixed(1)}% shows the business generates strong returns on shareholder capital`);
  }

  // Balance sheet
  if (data.debtToEquity !== null && data.debtToEquity < 50) {
    bullPoints.push("Conservative balance sheet with low leverage — can weather downturns");
  } else if (data.debtToEquity !== null && data.debtToEquity > 150) {
    bearPoints.push(`Debt-to-equity of ${data.debtToEquity.toFixed(0)} is concerning — rising rates could squeeze margins`);
  }

  if (data.freeCashflow !== null && data.freeCashflow > 0) {
    bullPoints.push(`Generating $${formatLargeNumber(data.freeCashflow)} in free cash flow — real money, not just accounting profits`);
  } else if (data.freeCashflow !== null && data.freeCashflow < 0) {
    bearPoints.push("Burning cash — need to see a path to positive free cash flow");
  }

  // Growth
  if (data.revenueGrowth !== null && data.revenueGrowth > 0.1) {
    bullPoints.push(`Revenue growing ${(data.revenueGrowth * 100).toFixed(1)}% — top-line momentum is intact`);
  } else if (data.revenueGrowth !== null && data.revenueGrowth < -0.05) {
    bearPoints.push(`Revenue declining ${(data.revenueGrowth * 100).toFixed(1)}% — shrinking business is hard to value-invest into`);
  }

  if (data.earningsGrowth !== null && data.earningsGrowth > 0.15) {
    bullPoints.push(`Earnings growing ${(data.earningsGrowth * 100).toFixed(1)}% — profit engine accelerating`);
  } else if (data.earningsGrowth !== null && data.earningsGrowth < -0.1) {
    bearPoints.push(`Earnings shrinking ${(data.earningsGrowth * 100).toFixed(1)}% — profitability under pressure`);
  }

  // Dividend
  if (data.dividendYield > 0.03) {
    bullPoints.push(`${(data.dividendYield * 100).toFixed(2)}% dividend yield provides income while you wait`);
  }
  if (data.payoutRatio !== null && data.payoutRatio > 0.8) {
    bearPoints.push(`Payout ratio of ${(data.payoutRatio * 100).toFixed(0)}% — dividend may not be sustainable`);
  }

  // Technical / Behavioral
  const range = data.fiftyTwoWeekHigh - data.fiftyTwoWeekLow;
  if (range > 0) {
    const position = (data.currentPrice - data.fiftyTwoWeekLow) / range;
    if (position < 0.3) {
      bullPoints.push("Trading near the bottom of its 52-week range — contrarian opportunity if fundamentals hold");
    } else if (position > 0.9) {
      bearPoints.push("At the top of its 52-week range — limited upside without a catalyst");
    }
  }

  if (data.shortPercentOfFloat !== null && data.shortPercentOfFloat > 0.15) {
    bearPoints.push(`${(data.shortPercentOfFloat * 100).toFixed(1)}% of float is shorted — smart money is skeptical`);
  }

  if (data.beta !== null && data.beta > 1.5) {
    bearPoints.push(`High beta of ${data.beta.toFixed(2)} — this stock amplifies market swings`);
  } else if (data.beta !== null && data.beta < 0.7) {
    bullPoints.push(`Low beta of ${data.beta.toFixed(2)} — defensive characteristics in volatile markets`);
  }

  // Ensure at least one point each
  if (bullPoints.length === 0) bullPoints.push("Limited bullish signals — requires deeper due diligence");
  if (bearPoints.length === 0) bearPoints.push("No major red flags identified from available data");

  return { bullPoints, bearPoints };
}

// ── Helpers ────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function formatLargeNumber(num: number): string {
  const abs = Math.abs(num);
  if (abs >= 1_000_000_000_000) return (num / 1_000_000_000_000).toFixed(2) + "T";
  if (abs >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + "B";
  if (abs >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
  if (abs >= 1_000) return (num / 1_000).toFixed(2) + "K";
  return num.toFixed(2);
}
