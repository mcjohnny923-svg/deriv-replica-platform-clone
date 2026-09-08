import { useEffect, useState } from 'react';

export interface DigitFlashEvent {
  digit: number;
  won: boolean;
  key: number;
}

interface DigitStatsDisplayProps {
  selectedDigit: number | null;
  flash?: DigitFlashEvent | null;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const HISTORY_LENGTH = 120;

function randomDigit() {
  return Math.floor(Math.random() * 10);
}

const DigitStatsDisplay = ({ selectedDigit, flash }: DigitStatsDisplayProps) => {
  const [history, setHistory] = useState<number[]>(() =>
    Array.from({ length: HISTORY_LENGTH }, randomDigit),
  );
  const [lastTickDigit, setLastTickDigit] = useState<number>(history[history.length - 1]);
  const [activeFlash, setActiveFlash] = useState<{ digit: number; won: boolean } | null>(null);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!flash) return;
    setActiveFlash({ digit: flash.digit, won: flash.won });
    setFading(false);
    const fadeTimer = setTimeout(() => setFading(true), 300);
    const clearTimer = setTimeout(() => setActiveFlash(null), 1800);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(clearTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flash?.key]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHistory((prev) => {
        const next = randomDigit();
        setLastTickDigit(next);
        const updated = [...prev.slice(1), next];
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const counts = DIGITS.map(
    (d) => history.filter((h) => h === d).length,
  );
  const percentages = counts.map((c) => (c / history.length) * 100);
  const maxPct = Math.max(...percentages);
  const minPct = Math.min(...percentages);
  const maxDigit = percentages.indexOf(maxPct);
  const minDigit = percentages.indexOf(minPct);

  const ringColor = (digit: number) => {
    if (activeFlash && activeFlash.digit === digit) return activeFlash.won ? '#00d68f' : '#ff444f';
    if (digit === maxDigit) return '#00d68f';
    if (digit === minDigit) return '#ff444f';
    return '#6b7280';
  };

  return (
    <div className="bg-[#151717] border border-[#323738] rounded-lg px-2 py-3">
      <div className="grid grid-cols-10 gap-1">
        {DIGITS.map((digit) => {
          const pct = percentages[digit];
          const isSelected = selectedDigit === digit;
          const isLastTick = lastTickDigit === digit;
          const arcLength = Math.min(pct / 20, 1) * CIRCUMFERENCE;

          return (
            <div key={digit} className="relative flex flex-col items-center">
              <div className="relative w-full aspect-square">
                {activeFlash && activeFlash.digit === digit && (
                  <div
                    className={`absolute inset-0 -m-3 rounded-full blur-lg transition-opacity duration-1000 ${
                      activeFlash.won ? 'bg-green-400' : 'bg-red-500'
                    } ${fading ? 'opacity-0' : 'opacity-100'}`}
                    style={{ boxShadow: activeFlash.won ? '0 0 24px 8px rgba(0,214,143,0.9)' : '0 0 24px 8px rgba(255,68,79,0.9)' }}
                  />
                )}
                <svg
                  viewBox="0 0 64 64"
                  className="w-full h-full -rotate-90"
                >
                  {/* Background track */}
                  <circle
                    cx="32"
                    cy="32"
                    r={RADIUS}
                    fill="none"
                    stroke="#2a2f30"
                    strokeWidth="4"
                  />
                  {/* Value ring */}
                  <circle
                    cx="32"
                    cy="32"
                    r={RADIUS}
                    fill="none"
                    stroke={ringColor(digit)}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${arcLength} ${CIRCUMFERENCE}`}
                    style={{ transition: 'stroke-dasharray 0.4s ease' }}
                  />
                  {/* Selection highlight ring */}
                  {isSelected && (
                    <circle
                      cx="32"
                      cy="32"
                      r={RADIUS + 5}
                      fill="none"
                      stroke="#7c5cff"
                      strokeWidth="2"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                  <span
                    className={`text-[10px] font-semibold ${
                      isSelected ? 'text-[#7c5cff]' : 'text-white'
                    }`}
                  >
                    {digit}
                  </span>
                  <span className="text-[6px] text-gray-400 mt-0.5">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              </div>
              {isLastTick && (
                <div className="mt-1 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[7px] border-b-red-500" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DigitStatsDisplay;
