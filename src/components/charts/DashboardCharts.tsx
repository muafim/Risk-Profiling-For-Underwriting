import * as ReactEChartsCoreModule from "echarts-for-react/lib/core";
import type { ComponentType } from "react";
import * as echarts from "echarts/core";
import { BarChart, BoxplotChart, CustomChart, ScatterChart } from "echarts/charts";
import { AriaComponent, GridComponent, LegendComponent, MarkLineComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { ImportanceRow, ModelMetric, RiskClass } from "../../types/dashboard";

echarts.use([BarChart, BoxplotChart, CustomChart, ScatterChart, AriaComponent, GridComponent, LegendComponent, MarkLineComponent, TooltipComponent, CanvasRenderer]);

type ChartProps = { option: object; style?: object; "aria-label"?: string };
const coreModule = ReactEChartsCoreModule as unknown as { default?: { default?: ComponentType<ChartProps & { echarts: typeof echarts }> } | ComponentType<ChartProps & { echarts: typeof echarts }> };
const ReactEChartsCore = ((typeof coreModule.default === "object" && coreModule.default?.default) || coreModule.default || ReactEChartsCoreModule) as ComponentType<ChartProps & { echarts: typeof echarts }>;
const Chart = (props: ChartProps) => <ReactEChartsCore echarts={echarts} {...props} />;

const text = "#111827";
const muted = "#667085";
const grid = "#D8E0E8";
const navy = "#152238";
const blue = "#2563EB";
const teal = "#0F766E";
const orange = "#D97706";

const tooltip = {
  backgroundColor: "#111827",
  borderWidth: 0,
  textStyle: { color: "#fff", fontFamily: "Inter, system-ui, sans-serif" },
  padding: [10, 12],
};

export function RiskDistributionChart({ data }: { data: RiskClass[] }) {
  return (
    <div>
      <Chart
        aria-label="Horizontal stacked bar showing the labeled Risk Profile distribution"
        style={{ height: 150 }}
        option={{
          animationDuration: 700,
          tooltip: { ...tooltip, trigger: "item", formatter: (p: { name: string; value: number }) => `${p.name}<br/><b>${(p.value * 100).toFixed(2)}%</b>` },
          grid: { left: 0, right: 0, top: 20, bottom: 42 },
          xAxis: { type: "value", max: 1, show: false },
          yAxis: { type: "category", data: ["Labeled records"], show: false },
          series: data.map((item) => ({
            name: item.label,
            type: "bar",
            stack: "risk",
            data: [item.share],
            barWidth: 54,
            itemStyle: { color: item.color },
            label: {
              show: true,
              position: "inside",
              formatter: `${item.label}\n${(item.share * 100).toFixed(2)}%`,
              color: "#fff",
              fontWeight: 800,
              fontSize: 12,
              lineHeight: 18,
            },
          })),
        }}
      />
      <div className="chart-annotation">← Class imbalance immediately creates an accuracy trap.</div>
    </div>
  );
}

export function ModelComparisonChart({ models, reference }: { models: ModelMetric[]; reference: number }) {
  const sorted = [...models].sort((a, b) => b.macro_f1 - a.macro_f1);
  return (
    <Chart
      aria-label="Grouped horizontal bar chart comparing accuracy, balanced accuracy, and macro-F1 across six models"
      style={{ height: 470 }}
      option={{
        tooltip: {
          ...tooltip,
          trigger: "axis",
          axisPointer: { type: "shadow" },
          formatter: (params: Array<{ seriesName: string; value: number; axisValue: string }>) => {
            const lines = params.map((p) => `${p.seriesName}<br/><b>${(p.value * 100).toFixed(2)}%</b>`).join("<br/>");
            return `<b>${params[0]?.axisValue?.toUpperCase()}</b><br/>${lines}`;
          },
        },
        legend: { top: 0, left: 0, textStyle: { color: muted }, itemWidth: 12, itemHeight: 12 },
        grid: { left: 196, right: 28, top: 60, bottom: 28 },
        xAxis: {
          type: "value",
          min: 0,
          max: 0.65,
          axisLabel: { formatter: (v: number) => `${Math.round(v * 100)}%`, color: muted },
          splitLine: { lineStyle: { color: grid } },
        },
        yAxis: {
          type: "category",
          inverse: true,
          data: sorted.map((m) => m.model),
          axisLabel: { color: text, width: 176, overflow: "break", lineHeight: 16 },
          axisLine: { show: false },
          axisTick: { show: false },
        },
        series: [
          { name: "Accuracy", type: "bar", data: sorted.map((m) => m.accuracy), itemStyle: { color: "#9AA7B6" }, barMaxWidth: 12 },
          {
            name: "Balanced Accuracy",
            type: "bar",
            data: sorted.map((m) => m.balanced_accuracy),
            itemStyle: { color: blue },
            barMaxWidth: 12,
            markLine: {
              symbol: "none",
              lineStyle: { color: orange, width: 2, type: "dashed" },
              label: { formatter: "3-class reference ≈ 0.33", color: orange, position: "insideEndTop" },
              data: [{ xAxis: reference }],
            },
          },
          { name: "Macro-F1", type: "bar", data: sorted.map((m) => m.macro_f1), itemStyle: { color: teal }, barMaxWidth: 12 },
        ],
      }}
    />
  );
}

export function ShuffleComparisonChart({ data }: { data: Array<{ metric: string; real: number; shuffled: number }> }) {
  return (
    <Chart
      aria-label="Paired dot chart comparing model metrics on real and shuffled labels"
      style={{ height: 300 }}
      option={{
        tooltip: { ...tooltip, trigger: "axis" },
        grid: { left: 120, right: 42, top: 38, bottom: 46 },
        xAxis: {
          type: "value",
          min: 0.285,
          max: 0.34,
          axisLabel: { formatter: (v: number) => `${(v * 100).toFixed(1)}%`, color: muted },
          splitLine: { lineStyle: { color: grid } },
        },
        yAxis: { type: "category", data: data.map((d) => d.metric), axisLabel: { color: text }, axisLine: { show: false }, axisTick: { show: false } },
        series: [
          {
            name: "Connector",
            type: "custom",
            silent: true,
            renderItem: (_params: unknown, api: { value: (index: number) => number; coord: (value: number[]) => number[] }) => {
              const start = api.coord([api.value(0), api.value(2)]);
              const end = api.coord([api.value(1), api.value(2)]);
              return { type: "line", shape: { x1: start[0], y1: start[1], x2: end[0], y2: end[1] }, style: { stroke: "#A8B3C1", lineWidth: 3 } };
            },
            data: data.map((d, i) => [d.real, d.shuffled, i]),
          },
          { name: "Real labels", type: "scatter", symbolSize: 18, data: data.map((d, i) => [d.real, i]), itemStyle: { color: blue }, label: { show: true, position: "top", formatter: (p: { value: number[] }) => `${(p.value[0] * 100).toFixed(2)}%`, color: blue, fontWeight: 800 } },
          { name: "Shuffled labels", type: "scatter", symbolSize: 18, data: data.map((d, i) => [d.shuffled, i]), itemStyle: { color: orange }, label: { show: true, position: "bottom", formatter: (p: { value: number[] }) => `${(p.value[0] * 100).toFixed(2)}%`, color: orange, fontWeight: 800 } },
        ],
      }}
    />
  );
}

export function FeatureImportanceChart({ rows, mode }: { rows: ImportanceRow[]; mode: "permutation" | "gain" }) {
  const data = [...rows].reverse();
  const isPermutation = mode === "permutation";
  return (
    <Chart
      aria-label={`${isPermutation ? "Permutation" : "Model gain"} feature importance chart for the top ten features`}
      style={{ height: 430 }}
      option={{
        tooltip: { ...tooltip, trigger: "axis" },
        grid: { left: 198, right: 44, top: 24, bottom: 42 },
        xAxis: {
          type: "value",
          axisLabel: { color: muted, formatter: (v: number) => isPermutation ? v.toFixed(3) : Math.round(v).toLocaleString() },
          splitLine: { lineStyle: { color: grid } },
        },
        yAxis: { type: "category", data: data.map((d) => d.label), axisLabel: { color: text, width: 178, overflow: "truncate" }, axisLine: { show: false }, axisTick: { show: false } },
        series: [
          {
            type: "bar",
            data: data.map((d) => isPermutation ? d.permutation_macro_f1_drop_mean : d.gain),
            barWidth: 10,
            itemStyle: { color: isPermutation ? blue : navy },
            markLine: isPermutation ? { symbol: "none", data: [{ xAxis: 0 }], lineStyle: { color: "#98A2B3", width: 1 }, label: { show: false } } : undefined,
          },
          ...(isPermutation ? [{
            type: "custom",
            silent: true,
            renderItem: (_params: unknown, api: { value: (index: number) => number; coord: (value: number[]) => number[] }) => {
              const mean = api.value(0); const std = api.value(1); const idx = api.value(2);
              const low = api.coord([mean - std, idx]); const high = api.coord([mean + std, idx]);
              return { type: "group", children: [
                { type: "line", shape: { x1: low[0], y1: low[1], x2: high[0], y2: high[1] }, style: { stroke: orange, lineWidth: 2 } },
                { type: "line", shape: { x1: low[0], y1: low[1] - 4, x2: low[0], y2: low[1] + 4 }, style: { stroke: orange, lineWidth: 2 } },
                { type: "line", shape: { x1: high[0], y1: high[1] - 4, x2: high[0], y2: high[1] + 4 }, style: { stroke: orange, lineWidth: 2 } },
              ] };
            },
            data: data.map((d, i) => [d.permutation_macro_f1_drop_mean, d.permutation_std, i]),
          }] : []),
        ],
      }}
    />
  );
}

export function ClusterQualityChart({ data }: { data: Array<{ name: string; silhouette: number }> }) {
  return (
    <Chart
      aria-label="Bar chart comparing silhouette scores for the two original RFM analyses and the V2 numeric diagnostic"
      style={{ height: 300 }}
      option={{
        tooltip: { ...tooltip, trigger: "axis" },
        grid: { left: 48, right: 20, top: 30, bottom: 68 },
        xAxis: { type: "category", data: data.map((d) => d.name), axisLabel: { color: muted, interval: 0, width: 112, overflow: "break", lineHeight: 15 }, axisTick: { show: false } },
        yAxis: { type: "value", max: 0.35, axisLabel: { color: muted, formatter: (v: number) => v.toFixed(2) }, splitLine: { lineStyle: { color: grid } } },
        series: [{ type: "bar", data: data.map((d, i) => ({ value: d.silhouette, itemStyle: { color: i === 2 ? orange : blue } })), barWidth: 54, label: { show: true, position: "top", formatter: (p: { value: number }) => p.value.toFixed(3), color: text, fontWeight: 800 } }],
      }}
    />
  );
}

export function ReasonFrequencyChart({ data }: { data: Array<{ feature: string; count: number }> }) {
  const rows = data.slice(0, 8).reverse();
  return (
    <Chart
      aria-label="Horizontal bar chart showing the most frequent reasons behind anomaly review rankings"
      style={{ height: 330 }}
      option={{
        tooltip: { ...tooltip, trigger: "axis" },
        grid: { left: 196, right: 28, top: 20, bottom: 34 },
        xAxis: { type: "value", axisLabel: { color: muted }, splitLine: { lineStyle: { color: grid } } },
        yAxis: { type: "category", data: rows.map((d) => d.feature), axisLabel: { color: text, width: 176, overflow: "truncate" }, axisLine: { show: false }, axisTick: { show: false } },
        series: [{ type: "bar", data: rows.map((d) => d.count), barWidth: 14, itemStyle: { color: teal }, label: { show: true, position: "right", color: text, fontWeight: 700 } }],
      }}
    />
  );
}

export function AnomalyBoxplotChart({ data }: { data: Array<{ riskProfile: string; count: number; min: number | null; q1: number | null; median: number | null; q3: number | null; max: number | null }> }) {
  const valid = data.filter((d) => d.count > 0 && d.min !== null);
  const colors: Record<string, string> = { Low: blue, Medium: orange, High: "#C62828", Unlabeled: "#667085" };
  return (
    <Chart
      aria-label="Box plot summarizing anomaly scores across existing Risk Profile categories"
      style={{ height: 320 }}
      option={{
        tooltip: { ...tooltip, trigger: "item" },
        grid: { left: 58, right: 24, top: 28, bottom: 50 },
        xAxis: { type: "category", data: valid.map((d) => `${d.riskProfile}\nn=${d.count}`), axisLabel: { color: text, lineHeight: 16 }, axisTick: { show: false } },
        yAxis: { type: "value", min: 0.675, max: 0.715, axisLabel: { color: muted, formatter: (v: number) => v.toFixed(3) }, splitLine: { lineStyle: { color: grid } } },
        series: [{
          type: "boxplot",
          data: valid.map((d) => ({ value: [d.min, d.q1, d.median, d.q3, d.max], itemStyle: { color: `${colors[d.riskProfile]}33`, borderColor: colors[d.riskProfile], borderWidth: 2 } })),
          boxWidth: [26, 52],
        }],
      }}
    />
  );
}
