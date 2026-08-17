import { useState, useEffect, useRef } from 'react';
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import {
  createChart,
  AreaSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';

interface DerivChartProps {
  selectedAsset: string;
  onAssetChange: (asset: string) => void;
}

interface AssetGroup {
  label: string;
  assets: string[];
}

const TIMEFRAMES = ['1T', '5T', '15T', '30T', '1H', '4H', '1D'];

const TIMEFRAME_SECONDS: Record<string, number> = {
  '1T': 1,
  '5T': 5,
  '15T': 15,
  '30T': 30,
  '1H': 3600,
  '4H': 14400,
  '1D': 86400,
};

const DerivChart = ({ selectedAsset, onAssetChange }: DerivChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lastCandleRef = useRef<{ time: number; open: number; high: number; low: number; close: number } | null>(null);
  const priceRef = useRef(12547.89);

  const [currentPrice, setCurrentPrice] = useState(12547.89);
  const [priceChange, setPriceChange] = useState(+12.34);
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [isTimeframeDropdownOpen, setIsTimeframeDropdownOpen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1T');

  const isTickMode = selectedTimeframe === '1T';

  const assetGroups: AssetGroup[] = [
    {
      label: 'Continuous Indices',
      assets: [
        'Volatility 10 Index',
        'Volatility 25 Index',
        'Volatility 50 Index',
        'Volatility 75 Index',
        'Volatility 100 Index',
      ],
    },
    {
      label: '1s Indices',
      assets: [
        'Volatility 10 (1s) Index',
        'Volatility 15 (1s) Index',
        'Volatility 25 (1s) Index',
        'Volatility 30 (1s) Index',
        'Volatility 50 (1s) Index',
        'Volatility 75 (1s) Index',
        'Volatility 90 (1s) Index',
        'Volatility 100 (1s) Index',
      ],
    },
    {
      label: 'Forex',
      assets: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'],
    },
  ];

  // Create chart once
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#151717' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#232728' },
        horzLines: { color: '#232728' },
      },
      rightPriceScale: {
        borderColor: '#323738',
      },
      timeScale: {
        borderColor: '#323738',
        timeVisible: true,
        secondsVisible: true,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    chartRef.current = chart;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      areaSeriesRef.current = null;
      candleSeriesRef.current = null;
    };
  }, []);

  // Switch series type + seed initial data when timeframe or asset changes
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (areaSeriesRef.current) {
      chart.removeSeries(areaSeriesRef.current);
      areaSeriesRef.current = null;
    }
    if (candleSeriesRef.current) {
      chart.removeSeries(candleSeriesRef.current);
      candleSeriesRef.current = null;
    }

    const now = Math.floor(Date.now() / 1000);
    let basePrice = priceRef.current;

    if (isTickMode) {
      const series = chart.addSeries(AreaSeries, {
        lineColor: '#ffffff',
        topColor: 'rgba(255,255,255,0.25)',
        bottomColor: 'rgba(255,255,255,0.0)',
        lineWidth: 2,
        priceLineVisible: true,
        lastValueVisible: true,
      });

      const seed = Array.from({ length: 100 }, (_, i) => {
        basePrice += (Math.random() - 0.5) * 3;
        return { time: (now - (100 - i)) as UTCTimestamp, value: basePrice };
      });
      series.setData(seed);
      areaSeriesRef.current = series;
      priceRef.current = basePrice;
    } else {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: '#00d68f',
        downColor: '#ff444f',
        borderVisible: false,
        wickUpColor: '#00d68f',
        wickDownColor: '#ff444f',
      });

      const intervalSec = TIMEFRAME_SECONDS[selectedTimeframe];
      const seed: { time: number; open: number; high: number; low: number; close: number }[] = [];
      let t = now - intervalSec * 100;
      for (let i = 0; i < 100; i++) {
        const open = basePrice;
        const close = open + (Math.random() - 0.5) * 40;
        const high = Math.max(open, close) + Math.random() * 15;
        const low = Math.min(open, close) - Math.random() * 15;
        seed.push({ time: t, open, high, low, close });
        basePrice = close;
        t += intervalSec;
      }
      series.setData(seed as never);
      candleSeriesRef.current = series;
      priceRef.current = basePrice;
      lastCandleRef.current = seed[seed.length - 1];
    }

    chart.timeScale().fitContent();
  }, [isTickMode, selectedTimeframe, selectedAsset]);

  // Live updates
  useEffect(() => {
    const interval = setInterval(() => {
      const change = (Math.random() - 0.5) * (isTickMode ? 3 : 8);
      const newPrice = Math.max(0, priceRef.current + change);
      priceRef.current = newPrice;
      setCurrentPrice(newPrice);
      setPriceChange(change);

      const now = Math.floor(Date.now() / 1000);

      if (isTickMode && areaSeriesRef.current) {
        areaSeriesRef.current.update({ time: now as UTCTimestamp, value: newPrice });
      } else if (!isTickMode && candleSeriesRef.current && lastCandleRef.current) {
        const intervalSec = TIMEFRAME_SECONDS[selectedTimeframe];
        const last = lastCandleRef.current;
        const bucketTime = Math.floor(now / intervalSec) * intervalSec;

        if (bucketTime === last.time) {
          const updated = {
            ...last,
            high: Math.max(last.high, newPrice),
            low: Math.min(last.low, newPrice),
            close: newPrice,
          };
          lastCandleRef.current = updated;
          candleSeriesRef.current.update(updated as never);
        } else {
          const fresh = {
            time: bucketTime,
            open: last.close,
            high: newPrice,
            low: newPrice,
            close: newPrice,
          };
          lastCandleRef.current = fresh;
          candleSeriesRef.current.update(fresh as never);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTickMode, selectedTimeframe]);

  return (
    <div className="flex-1 bg-[#0e0e0e] p-3 sm:p-4 flex flex-col">
      {/* Asset selector and price info */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
          <div className="relative shrink-0">
            <button
              onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#323738] rounded hover:bg-[#414647] transition-colors max-w-[150px] sm:max-w-none"
            >
              <span className="font-medium text-white text-xs sm:text-sm truncate">{selectedAsset}</span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            </button>

            {isAssetDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-72 max-h-96 overflow-y-auto bg-[#323738] border border-[#414647] rounded-lg shadow-lg z-50">
                {assetGroups.map((group) => (
                  <div key={group.label}>
                    <div className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400 sticky top-0 bg-[#323738]">
                      {group.label}
                    </div>
                    {group.assets.map((asset) => (
                      <button
                        key={asset}
                        onClick={() => {
                          onAssetChange(asset);
                          setIsAssetDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between w-full text-left px-4 py-2.5 hover:bg-[#414647] text-white transition-colors ${
                          asset === selectedAsset ? 'bg-[#414647]/60' : ''
                        }`}
                      >
                        <span>{asset}</span>
                        {asset === selectedAsset && (
                          <span className="text-red-500 text-sm">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <div className="text-lg sm:text-2xl font-bold text-white truncate">
              {currentPrice.toFixed(2)}
            </div>
            <div
              className={`flex items-center space-x-1 px-1.5 sm:px-2 py-1 rounded text-xs sm:text-sm shrink-0 ${
                priceChange >= 0
                  ? 'text-green-400 bg-green-400/10'
                  : 'text-red-400 bg-red-400/10'
              }`}
            >
              {priceChange >= 0 ? <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              <span>{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Timeframe dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsTimeframeDropdownOpen(!isTimeframeDropdownOpen)}
            className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-semibold rounded transition-colors"
          >
            {selectedTimeframe}
          </button>

          {isTimeframeDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 w-24 bg-[#323738] border border-[#414647] rounded-lg shadow-lg z-50 overflow-hidden">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => {
                    setSelectedTimeframe(tf);
                    setIsTimeframeDropdownOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                    selectedTimeframe === tf
                      ? 'bg-red-500 text-white'
                      : 'text-gray-300 hover:bg-[#414647] hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart, zoom/pan scoped to this element only via lightweight-charts */}
      <div className="flex-1 min-h-[320px] bg-[#151717] rounded-lg overflow-hidden">
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default DerivChart;
