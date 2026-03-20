"use client";

import { useState } from "react";
import { StockData, ScorecardResult, BullBearResult, calculateScorecard, generateBullBear, formatLargeNumber } from "@/lib/scorecard";

// ── Metric Explanations ────────────────────────────────────────────────

const metricExplanations: Record<string, string> = {
  "Market Cap": "The total value of all a company's shares. Think of it as the price tag to buy the entire business. Large cap ($100B+) means established, small cap (under $2B) means higher risk but more growth potential.",
  "P/E Ratio": "Price-to-Earnings. How much investors pay for every $1 of profit. A P/E of 15 means you're paying $15 for $1 of earnings. Lower can mean undervalued, higher can mean overpriced — or that investors expect big growth.",
  "Forward P/E": "Same as P/E, but uses next year's estimated earnings instead of last year's actual earnings. If it's lower than the trailing P/E, analysts expect profits to grow.",
  "PEG Ratio": "P/E divided by earnings growth rate. It adjusts valuation for growth. Under 1.0 means you might be getting growth at a discount. Over 2.0 means you're paying a premium.",
  "52W High": "The highest price this stock has traded at in the past year. If the current price is close to this, the stock is near its peak. The Zen Dhandho method prefers buying away from the high.",
  "52W Low": "The lowest price in the past year. If the stock is near this, it could be a bargain — or falling for a reason. This is where value investors start paying attention.",
  "Dividend Yield": "The annual dividend payment as a percentage of the stock price. A 3% yield means you earn $3/year for every $100 invested, regardless of price movement. Provides income while you wait.",
  "Beta": "How much the stock moves compared to the overall market. Beta of 1.0 = moves with the market. Under 1.0 = calmer, more defensive. Over 1.5 = more volatile, bigger swings both ways.",
  "Debt/Equity": "How much debt the company carries relative to shareholder equity. Under 50 is conservative. Over 100 means the company relies heavily on borrowed money — risky if rates rise or revenue dips.",
  "ROE": "Return on Equity. How efficiently the company turns shareholder money into profit. Over 15% is good, over 20% suggests a real competitive advantage. Warren Buffett's favorite metric.",
  "Profit Margin": "What percentage of revenue becomes actual profit after all expenses. Higher margins mean the business keeps more of every dollar it earns — a sign of pricing power and efficiency.",
  "Free Cash Flow": "The real cash a business generates after paying for operations and equipment. This is the money available for dividends, buybacks, paying down debt, or reinvesting. Profit can be manipulated — cash flow is harder to fake.",
};

const scorecardExplanations: Record<string, string> = {
  "Valuation": "Are you paying a fair price? The Zen Dhandho method is rooted in buying businesses for less than they're worth. This score looks at P/E, PEG, price-to-book, and where the stock sits in its 52-week range to determine if the market is offering you a deal — or charging a premium.",
  "Moat": "Can this business defend itself? A moat is a competitive advantage that keeps rivals at bay — think brand loyalty, patents, network effects, or cost advantages. We measure this through margins, return on equity, and market position. Wide moat = durable business.",
  "Balance Sheet": "Is the foundation solid? A company with low debt, strong cash reserves, and positive free cash flow can survive downturns and capitalize on opportunities. Heavy debt is like building on sand — it works until it doesn't.",
  "Behavioral Factors": "What is the crowd doing? This score tracks market sentiment — volatility, short interest, momentum, and unusual trading activity. The Zen Dhandho method looks for opportunities where fear has pushed prices below fair value, or where euphoria has inflated them.",
  "Margin of Safety": "How much cushion do you have if things go wrong? This is the core Zen Dhandho principle — never invest without a buffer. We look at how far the stock has fallen from highs, dividend income as downside protection, and whether earnings and revenue trends support the current price.",
};

const convictionExplanations: Record<string, string> = {
  "Very High": "40-50 points. Strong across all categories. The kind of opportunity the Zen Dhandho method was built for — fair price, strong business, solid margin of safety.",
  "High": "30-39 points. Most indicators look favorable. Worth serious consideration, but dig deeper into any weak categories before committing.",
  "Medium": "20-29 points. Mixed signals. Some strengths, some concerns. Might be worth watching, but the setup isn't compelling enough to act on without more research.",
  "Low": "Below 20 points. Multiple red flags. Either overvalued, fundamentally weak, or both. The Zen Dhandho approach says patience — wait for a better setup.",
};

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [scorecard, setScorecard] = useState<ScorecardResult | null>(null);
  const [bullBear, setBullBear] = useState<BullBearResult | null>(null);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!ticker.trim()) return;
    setLoading(true);
    setError(null);
    setStockData(null);
    setScorecard(null);
    setBullBear(null);
    setExpandedMetric(null);
    setExpandedCategory(null);

    try {
      const res = await fetch(`/api/stock?ticker=${encodeURIComponent(ticker.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setStockData(data);
      setScorecard(calculateScorecard(data));
      setBullBear(generateBullBear(data));
    } catch {
      setError("Failed to fetch stock data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const convictionColor = (conviction: string) => {
    switch (conviction) {
      case "Very High": return "text-[#5A9E70]";
      case "High": return "text-[#5A9E70]";
      case "Medium": return "text-[#E4C060]";
      case "Low": return "text-[#C85A4A]";
      default: return "text-[#8A7A58]";
    }
  };

  const scoreBarColor = (score: number) => {
    if (score >= 8) return "bg-[#5A9E70]";
    if (score >= 6) return "bg-[#5A9E70]/70";
    if (score >= 4) return "bg-[#E4C060]";
    if (score >= 3) return "bg-[#C8A428]";
    return "bg-[#C85A4A]";
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--zd-bg-deep)", color: "var(--zd-gold-muted)" }}>
      {/* Header */}
      <header className="border-b sticky top-0 z-10 backdrop-blur-sm" style={{ borderColor: "var(--zd-gold-border)", background: "rgba(11, 26, 14, 0.88)" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-widest" style={{ letterSpacing: "0.25em" }}>
              <span style={{ color: "var(--zd-gold)" }}>ZEN</span>{" "}
              <span style={{ color: "var(--zd-gold-muted)" }}>DHANDHO</span>
              <span className="text-xs align-super ml-0.5" style={{ color: "var(--zd-gold-muted)" }}>&reg;</span>
            </h1>
            <p className="text-xs mt-0.5 tracking-widest uppercase" style={{ color: "var(--zd-gold-muted)", fontFamily: "var(--font-jost), Jost, sans-serif" }}>Stock Analyzer</p>
          </div>
          {/* Search */}
          <div className="flex gap-2">
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Enter ticker (e.g. AAPL)"
              className="rounded-lg px-4 py-2 w-64 text-sm focus:outline-none transition-colors"
              style={{
                background: "var(--zd-bg-card)",
                border: "1px solid var(--zd-gold-border)",
                color: "var(--zd-gold-muted)",
                fontFamily: "var(--font-jost), Jost, sans-serif",
              }}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !ticker.trim()}
              className="font-medium px-5 py-2 rounded-lg text-sm transition-all"
              style={{
                background: loading || !ticker.trim() ? "var(--zd-bg-card)" : "var(--zd-gold)",
                color: loading || !ticker.trim() ? "var(--zd-gold-muted)" : "var(--zd-bg-deep)",
                fontFamily: "var(--font-jost), Jost, sans-serif",
              }}
            >
              {loading ? "Loading..." : "Analyze"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Error */}
        {error && (
          <div className="rounded-lg p-4 mb-6" style={{ background: "var(--zd-red-soft)", border: "1px solid var(--zd-red-border)" }}>
            <p className="text-sm" style={{ color: "var(--zd-red)" }}>{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!stockData && !loading && !error && (
          <div className="text-center py-24">
            <p className="text-sm tracking-widest uppercase mb-4" style={{ color: "var(--zd-gold)", fontFamily: "var(--font-jost), Jost, sans-serif" }}>
              Disciplined Investing
            </p>
            <h2 className="text-4xl font-light mb-4" style={{ color: "var(--zd-cream)", letterSpacing: "-0.5px" }}>
              Where Mindfulness{" "}
              <span className="italic" style={{ color: "var(--zd-gold-bright)" }}>Meets the Market</span>
            </h2>
            <p className="text-base max-w-lg mx-auto mb-3" style={{ color: "var(--zd-gold-muted)", fontFamily: "var(--font-jost), Jost, sans-serif" }}>
              Enter a stock ticker to get a full breakdown — valuation, financial health, and a Zen Dhandho scorecard that cuts through the noise.
            </p>
            <p className="text-sm" style={{ color: "var(--zd-gold-muted)", fontFamily: "var(--font-jost), Jost, sans-serif" }}>
              Every metric includes a plain-English explanation. Tap any number to learn what it means.
            </p>
            <div className="mt-8 mx-auto w-16 h-px" style={{ background: "var(--zd-gold-border)" }}></div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-32">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-t-transparent mb-4" style={{ borderColor: "var(--zd-gold)", borderTopColor: "transparent" }}></div>
            <p style={{ color: "var(--zd-gold-muted)", fontFamily: "var(--font-jost), Jost, sans-serif" }}>Fetching data for {ticker}...</p>
          </div>
        )}

        {/* Results */}
        {stockData && scorecard && bullBear && (
          <div className="space-y-6">
            {/* Stock Header */}
            <div className="rounded-xl p-6" style={{ background: "var(--zd-bg-panel)", border: "1px solid var(--zd-gold-border)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-light" style={{ color: "var(--zd-cream)", letterSpacing: "-0.5px" }}>{stockData.shortName}</h2>
                  <p className="mt-1 text-sm tracking-wide" style={{ color: "var(--zd-gold-muted)", fontFamily: "var(--font-jost), Jost, sans-serif" }}>
                    {stockData.symbol} · {stockData.exchange} · {stockData.sector}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-light" style={{ color: "var(--zd-cream)" }}>${stockData.currentPrice.toFixed(2)}</p>
                  <p className="text-sm font-medium mt-1" style={{ color: stockData.changePercent >= 0 ? "var(--zd-green-accent)" : "var(--zd-red)" }}>
                    {stockData.changePercent >= 0 ? "+" : ""}{stockData.changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Tap hint */}
              <p className="text-xs mt-5 mb-2 tracking-wide uppercase" style={{ color: "var(--zd-gold-muted)", fontFamily: "var(--font-jost), Jost, sans-serif" }}>
                Tap any metric to learn what it means
              </p>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <MetricCard label="Market Cap" value={`$${formatLargeNumber(stockData.marketCap)}`} expanded={expandedMetric} onToggle={setExpandedMetric} />
                <MetricCard label="P/E Ratio" value={stockData.trailingPE?.toFixed(1) ?? "N/A"} expanded={expandedMetric} onToggle={setExpandedMetric} />
                <MetricCard label="Forward P/E" value={stockData.forwardPE?.toFixed(1) ?? "N/A"} expanded={expandedMetric} onToggle={setExpandedMetric} />
                <MetricCard label="PEG Ratio" value={stockData.pegRatio?.toFixed(2) ?? "N/A"} expanded={expandedMetric} onToggle={setExpandedMetric} />
                <MetricCard label="52W High" value={`$${stockData.fiftyTwoWeekHigh.toFixed(2)}`} expanded={expandedMetric} onToggle={setExpandedMetric} />
                <MetricCard label="52W Low" value={`$${stockData.fiftyTwoWeekLow.toFixed(2)}`} expanded={expandedMetric} onToggle={setExpandedMetric} />
                <MetricCard label="Dividend Yield" value={stockData.dividendYield ? `${(stockData.dividendYield * 100).toFixed(2)}%` : "N/A"} expanded={expandedMetric} onToggle={setExpandedMetric} />
                <MetricCard label="Beta" value={stockData.beta?.toFixed(2) ?? "N/A"} expanded={expandedMetric} onToggle={setExpandedMetric} />
                <MetricCard label="Debt/Equity" value={stockData.debtToEquity?.toFixed(1) ?? "N/A"} expanded={expandedMetric} onToggle={setExpandedMetric} />
                <MetricCard label="ROE" value={stockData.returnOnEquity ? `${(stockData.returnOnEquity * 100).toFixed(1)}%` : "N/A"} expanded={expandedMetric} onToggle={setExpandedMetric} />
                <MetricCard label="Profit Margin" value={stockData.profitMargins ? `${(stockData.profitMargins * 100).toFixed(1)}%` : "N/A"} expanded={expandedMetric} onToggle={setExpandedMetric} />
                <MetricCard label="Free Cash Flow" value={stockData.freeCashflow ? `$${formatLargeNumber(stockData.freeCashflow)}` : "N/A"} expanded={expandedMetric} onToggle={setExpandedMetric} />
              </div>

              {/* Expanded Metric Explanation */}
              {expandedMetric && metricExplanations[expandedMetric] && (
                <div className="mt-4 rounded-lg p-4" style={{ background: "var(--zd-gold-soft)", border: "1px solid var(--zd-gold-border)" }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ color: "var(--zd-gold)", fontFamily: "var(--font-jost), Jost, sans-serif" }}>{expandedMetric}</p>
                      <p className="text-sm font-light leading-relaxed" style={{ color: "var(--zd-cream-dim)", fontFamily: "var(--font-jost), Jost, sans-serif" }}>{metricExplanations[expandedMetric]}</p>
                    </div>
                    <button onClick={() => setExpandedMetric(null)} className="ml-4 shrink-0 text-lg hover:opacity-70 transition-opacity" style={{ color: "var(--zd-gold-muted)" }}>&times;</button>
                  </div>
                </div>
              )}
            </div>

            {/* Scorecard */}
            <div className="rounded-xl p-6" style={{ background: "var(--zd-bg-panel)", border: "1px solid var(--zd-gold-border)" }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-light tracking-wide" style={{ color: "var(--zd-cream)" }}>Zen Dhandho Scorecard</h3>
                <div className="text-right">
                  <span className="text-3xl font-light" style={{ color: "var(--zd-gold-bright)" }}>{scorecard.totalScore}</span>
                  <span className="text-lg" style={{ color: "var(--zd-gold-muted)" }}> / {scorecard.maxScore}</span>
                  <p className={`text-sm font-medium mt-1 ${convictionColor(scorecard.conviction)}`} style={{ fontFamily: "var(--font-jost), Jost, sans-serif" }}>
                    {scorecard.conviction} Conviction
                  </p>
                </div>
              </div>

              {/* Conviction explanation */}
              <p className="text-xs mb-6 max-w-2xl" style={{ color: "var(--zd-gold-muted)", fontFamily: "var(--font-jost), Jost, sans-serif" }}>
                {convictionExplanations[scorecard.conviction]}
              </p>

              <p className="text-xs mb-4 tracking-wide uppercase" style={{ color: "var(--zd-gold-muted)", fontFamily: "var(--font-jost), Jost, sans-serif" }}>
                Tap any category to learn how it's scored
              </p>

              <div className="space-y-5">
                {scorecard.categories.map((cat) => (
                  <div key={cat.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setExpandedCategory(expandedCategory === cat.name ? null : cat.name)}
                        className="text-sm font-medium transition-colors flex items-center gap-1.5"
                        style={{ color: expandedCategory === cat.name ? "var(--zd-gold)" : "var(--zd-cream-dim)", fontFamily: "var(--font-jost), Jost, sans-serif" }}
                      >
                        <span className="text-xs" style={{ color: "var(--zd-gold-muted)" }}>{expandedCategory === cat.name ? "▼" : "▶"}</span>
                        {cat.name}
                      </button>
                      <span className="text-sm font-medium" style={{ color: "var(--zd-gold-muted)", fontFamily: "var(--font-jost), Jost, sans-serif" }}>{cat.score}/{cat.maxScore}</span>
                    </div>
                    <div className="w-full rounded-full h-2" style={{ background: "var(--zd-bg-card)" }}>
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${scoreBarColor(cat.score)}`}
                        style={{ width: `${(cat.score / cat.maxScore) * 100}%` }}
                      />
                    </div>
                    {/* Category explanation (expandable) */}
                    {expandedCategory === cat.name && scorecardExplanations[cat.name] && (
                      <div className="rounded-lg p-3 mt-1" style={{ background: "var(--zd-gold-soft)", border: "1px solid var(--zd-gold-border)" }}>
                        <p className="text-sm font-light leading-relaxed" style={{ color: "var(--zd-cream-dim)", fontFamily: "var(--font-jost), Jost, sans-serif" }}>{scorecardExplanations[cat.name]}</p>
                      </div>
                    )}
                    <p className="text-xs" style={{ color: "var(--zd-gold-muted)", fontFamily: "var(--font-jost), Jost, sans-serif" }}>{cat.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dhandho & Zen */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Dhandho's Thoughts (The Bull) */}
              <div className="rounded-xl p-6" style={{ background: "var(--zd-bg-panel)", border: "1px solid var(--zd-gold-border)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src="/characters/dhandho-bull.png"
                    alt="Dhandho the Bull"
                    className="w-16 h-16 rounded-full object-cover object-top"
                    style={{ border: "2px solid var(--zd-gold-border)" }}
                  />
                  <div>
                    <h3 className="text-lg font-light" style={{ color: "var(--zd-cream)" }}>Dhandho&apos;s Thoughts</h3>
                    <p className="text-xs tracking-widest uppercase" style={{ color: "var(--zd-gold-muted)", fontFamily: "var(--font-jost), Jost, sans-serif" }}>The Bull</p>
                  </div>
                </div>
                <p className="text-xs italic mb-4" style={{ color: "var(--zd-gold-muted)", fontFamily: "var(--font-jost), Jost, sans-serif" }}>
                  Bold. Energetic. Charges into every opportunity.
                </p>
                <ul className="space-y-3">
                  {bullBear.bullPoints.map((point, i) => (
                    <li key={i} className="flex gap-3 text-sm" style={{ fontFamily: "var(--font-jost), Jost, sans-serif" }}>
                      <span className="mt-0.5 shrink-0" style={{ color: "var(--zd-gold)" }}>+</span>
                      <span style={{ color: "var(--zd-gold-muted)" }}>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Zen's Thoughts (The Bear) */}
              <div className="rounded-xl p-6" style={{ background: "var(--zd-bg-panel)", border: "1px solid var(--zd-gold-border)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src="/characters/zen-bear.png"
                    alt="Zen the Bear"
                    className="w-16 h-16 rounded-full object-cover object-top"
                    style={{ border: "2px solid var(--zd-gold-border)" }}
                  />
                  <div>
                    <h3 className="text-lg font-light" style={{ color: "var(--zd-cream)" }}>Zen&apos;s Thoughts</h3>
                    <p className="text-xs tracking-widest uppercase" style={{ color: "var(--zd-gold-muted)", fontFamily: "var(--font-jost), Jost, sans-serif" }}>The Bear</p>
                  </div>
                </div>
                <p className="text-xs italic mb-4" style={{ color: "var(--zd-gold-muted)", fontFamily: "var(--font-jost), Jost, sans-serif" }}>
                  Calm. Disciplined. Sees what others miss by simply waiting.
                </p>
                <ul className="space-y-3">
                  {bullBear.bearPoints.map((point, i) => (
                    <li key={i} className="flex gap-3 text-sm" style={{ fontFamily: "var(--font-jost), Jost, sans-serif" }}>
                      <span className="mt-0.5 shrink-0" style={{ color: "var(--zd-gold)" }}>-</span>
                      <span style={{ color: "var(--zd-gold-muted)" }}>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-auto w-16 h-px my-4" style={{ background: "var(--zd-gold-border)" }}></div>

            {/* Disclaimer */}
            <p className="text-center text-xs italic" style={{ color: "var(--zd-gold-muted)", fontFamily: "var(--font-jost), Jost, sans-serif" }}>
              This tool is for educational purposes only. Not financial advice. Always do your own due diligence.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function MetricCard({ label, value, expanded, onToggle }: { label: string; value: string; expanded: string | null; onToggle: (label: string | null) => void }) {
  const isExpanded = expanded === label;
  return (
    <button
      onClick={() => onToggle(isExpanded ? null : label)}
      className="rounded-lg p-3 text-left transition-all"
      style={{
        background: isExpanded ? "var(--zd-gold-soft)" : "var(--zd-bg-card)",
        border: isExpanded ? "1px solid var(--zd-gold-border)" : "1px solid transparent",
      }}
    >
      <p className="text-xs mb-1 flex items-center gap-1" style={{ color: "var(--zd-gold-muted)", fontFamily: "var(--font-jost), Jost, sans-serif" }}>
        {label}
        <span style={{ color: "var(--zd-gold)", opacity: 0.5, fontSize: "10px" }}>?</span>
      </p>
      <p className="text-sm font-light" style={{ color: "var(--zd-gold-muted)", fontFamily: "var(--font-jost), Jost, sans-serif" }}>{value}</p>
    </button>
  );
}
