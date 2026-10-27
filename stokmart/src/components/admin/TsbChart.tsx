import React, { useState } from 'react';
import { DemandPeriod } from '../../types/inventory';
import { useInventory } from '../../context/InventoryContext';

interface TsbChartProps {
  periods: DemandPeriod[];
  reorderPoint: number;
  safetyStock: number;
  productName: string;
}

export const TsbChart: React.FC<TsbChartProps> = ({
  periods,
  reorderPoint,
  safetyStock,
  productName,
}) => {
  const { theme } = useInventory();
  const isLight = theme === 'light';
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!periods || periods.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-900/50 rounded-xl text-slate-500 text-xs">
        Tidak ada data histori permintaan
      </div>
    );
  }

  // Dimensions
  const width = 800;
  const height = 280;
  const padding = { top: 30, right: 30, bottom: 40, left: 45 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Max value calculation
  const maxActual = Math.max(...periods.map((p) => p.actualDemand), 1);
  const maxForecast = Math.max(...periods.map((p) => p.forecast || 0), 1);
  const maxY = Math.max(maxActual, maxForecast, reorderPoint, safetyStock) * 1.25;

  const getX = (index: number) => {
    return padding.left + (index / (periods.length - 1 || 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return padding.top + innerHeight - (val / maxY) * innerHeight;
  };

  // Generate SVG path for TSB forecast line
  const forecastPath = periods.reduce((path, pt, idx) => {
    const x = getX(idx);
    const y = getY(pt.forecast || 0);
    return idx === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
  }, '');

  // Theme-aware color variables
  const gridLineColor = isLight ? '#e2e8f0' : '#334155';
  const axisTextColor = isLight ? '#475569' : '#94a3b8';
  const forecastLineColor = isLight ? '#0284c7' : '#22d3ee'; // Sky-600 in light, Cyan-400 in dark
  const actualDemandColor = isLight ? '#059669' : '#10b981'; // Emerald-600 in light, Emerald-500 in dark
  const actualDemandHover = isLight ? '#047857' : '#34d399';
  const ropLineColor = isLight ? '#d97706' : '#fbbf24'; // Amber-600 in light, Amber-400 in dark
  const safetyStockColor = isLight ? '#e11d48' : '#f43f5e'; // Rose-600 in light, Rose-400 in dark
  const zeroDotColor = isLight ? '#94a3b8' : '#475569';

  return (
    <div className="relative w-full bg-slate-900 rounded-2xl border border-slate-800 p-4 overflow-hidden shadow-sm transition-colors">
      {/* Chart Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2 text-xs">
        <div>
          <span className="font-bold text-white block text-xs truncate max-w-sm">
            Grafik Permintaan Intermiten vs Peramalan TSB: {productName}
          </span>
          <span className="text-[11px] text-slate-400">
            Batang menunjukkan permintaan riil, garis kontinu adalah estimasi TSB yang meluruh anggun saat nol permintaan.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-xs inline-block"
              style={{ backgroundColor: actualDemandColor }}
            />
            <span className="text-slate-300 font-medium">Permintaan Aktual (y_t)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-4 h-0.5 inline-block"
              style={{ backgroundColor: forecastLineColor }}
            />
            <span className="text-slate-300 font-medium">Forecast TSB (ŷ_t)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-4 h-0.5 border-b border-dashed inline-block"
              style={{ borderColor: ropLineColor }}
            />
            <span className="text-amber-500 font-semibold">ROP ({reorderPoint})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-4 h-0.5 border-b border-dashed inline-block"
              style={{ borderColor: safetyStockColor }}
            />
            <span className="text-rose-500 font-semibold">Safety Stock ({safetyStock})</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[650px] select-none"
        >
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const val = maxY * pct;
            const y = getY(val);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={gridLineColor}
                  strokeDasharray="3 3"
                  strokeWidth="0.8"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill={axisTextColor}
                  fontWeight="500"
                >
                  {val.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Reorder Point (ROP) Threshold Line */}
          {reorderPoint > 0 && (
            <g>
              <line
                x1={padding.left}
                y1={getY(reorderPoint)}
                x2={width - padding.right}
                y2={getY(reorderPoint)}
                stroke={ropLineColor}
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={width - padding.right}
                y={getY(reorderPoint) - 6}
                textAnchor="end"
                fontSize="10"
                fill={ropLineColor}
                fontWeight="bold"
              >
                ROP: {reorderPoint} unit
              </text>
            </g>
          )}

          {/* Safety Stock Threshold Line */}
          {safetyStock > 0 && (
            <g>
              <line
                x1={padding.left}
                y1={getY(safetyStock)}
                x2={width - padding.right}
                y2={getY(safetyStock)}
                stroke={safetyStockColor}
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
              <text
                x={width - padding.right}
                y={getY(safetyStock) + 12}
                textAnchor="end"
                fontSize="9"
                fill={safetyStockColor}
                fontWeight="bold"
              >
                Safety Stock: {safetyStock} unit
              </text>
            </g>
          )}

          {/* Demand Bars (Intermittent) */}
          {periods.map((pt, idx) => {
            const x = getX(idx);
            const barWidth = Math.max(6, (innerWidth / periods.length) * 0.5);
            const y = getY(pt.actualDemand);
            const barHeight = Math.max(0, getY(0) - y);
            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer transition-opacity"
              >
                {/* Hit area */}
                <rect
                  x={x - barWidth}
                  y={padding.top}
                  width={barWidth * 2}
                  height={innerHeight}
                  fill="transparent"
                />

                {/* Actual Demand Bar */}
                {pt.actualDemand > 0 ? (
                  <rect
                    x={x - barWidth / 2}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="2"
                    fill={isHovered ? actualDemandHover : actualDemandColor}
                    opacity={isHovered ? 1 : 0.88}
                  />
                ) : (
                  // Period with 0 demand (hallmark of intermittent demand)
                  <circle
                    cx={x}
                    cy={getY(0)}
                    r="2.5"
                    fill={zeroDotColor}
                    opacity={0.8}
                  />
                )}

                {/* X Axis Period Label */}
                {(idx % 3 === 0 || idx === periods.length - 1) && (
                  <text
                    x={x}
                    y={height - 15}
                    textAnchor="middle"
                    fontSize="9"
                    fill={axisTextColor}
                    fontWeight="500"
                  >
                    {pt.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* TSB Forecast Continuous Curve */}
          <path
            d={forecastPath}
            fill="none"
            stroke={forecastLineColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* TSB Points */}
          {periods.map((pt, idx) => {
            const x = getX(idx);
            const y = getY(pt.forecast || 0);
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r="3"
                fill={isLight ? '#ffffff' : '#0f172a'}
                stroke={forecastLineColor}
                strokeWidth="1.8"
              />
            );
          })}

          {/* Hover highlight column */}
          {hoveredIdx !== null && periods[hoveredIdx] && (
            <g>
              <line
                x1={getX(hoveredIdx)}
                y1={padding.top}
                x2={getX(hoveredIdx)}
                y2={getY(0)}
                stroke={isLight ? '#64748b' : '#e2e8f0'}
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoveredIdx)}
                cy={getY(periods[hoveredIdx].forecast || 0)}
                r="5"
                fill={forecastLineColor}
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Floating Hover Details Box */}
      {hoveredIdx !== null && periods[hoveredIdx] && (
        <div className="mt-2 p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs flex flex-wrap items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
              {periods[hoveredIdx].label}
            </span>
            <span className="text-slate-300">
              Permintaan Aktual (y_t):{' '}
              <strong className="text-emerald-500 font-mono font-bold">
                {periods[hoveredIdx].actualDemand} unit
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-300">
            <span>
              Demand Size (z_t):{' '}
              <strong className="text-indigo-500 font-bold">
                {periods[hoveredIdx].z_t?.toFixed(3)}
              </strong>
            </span>
            <span>
              Probabilitas (p_t):{' '}
              <strong className="text-amber-500 font-bold">
                {((periods[hoveredIdx].p_t || 0) * 100).toFixed(1)}%
              </strong>
            </span>
            <span>
              TSB Forecast (ŷ_t):{' '}
              <strong className="text-cyan-600 font-bold">
                {periods[hoveredIdx].forecast?.toFixed(3)}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
