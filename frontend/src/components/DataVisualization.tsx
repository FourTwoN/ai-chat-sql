import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts';

interface DataVisualizationProps {
  data: any[];
  columns: string[];
  chartType?: 'auto' | 'bar' | 'line' | 'pie' | 'area' | 'radar' | 'scatter' | 'composed';
  title?: string;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#a855f7', // purple
];

interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area' | 'radar' | 'scatter' | 'composed';
  xKey: string;
  yKeys: string[];
  dataKey?: string;
  nameKey?: string;
}

export const DataVisualization: React.FC<DataVisualizationProps> = ({
  data,
  columns,
  chartType = 'auto',
  title
}) => {
  const chartConfig = useMemo(() => {
    return detectChartType(data, columns, chartType);
  }, [data, columns, chartType]);

  if (!chartConfig || data.length === 0) {
    return null;
  }

  const renderChart = () => {
    switch (chartConfig.type) {
      case 'pie':
        return renderPieChart(data, chartConfig);
      case 'line':
        return renderLineChart(data, chartConfig);
      case 'area':
        return renderAreaChart(data, chartConfig);
      case 'radar':
        return renderRadarChart(data, chartConfig);
      case 'scatter':
        return renderScatterChart(data, chartConfig);
      case 'composed':
        return renderComposedChart(data, chartConfig);
      case 'bar':
      default:
        return renderBarChart(data, chartConfig);
    }
  };

  return (
    <div className="my-6 p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      {title && (
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {title}
        </h3>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        {renderChart()}
      </div>
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
        <span>📊 {data.length} data points • {chartConfig.type.toUpperCase()} chart</span>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          Interactive visualization
        </span>
      </div>
    </div>
  );
};

function detectChartType(
  data: any[],
  columns: string[],
  chartType: string
): ChartConfig | null {
  if (data.length === 0 || columns.length === 0) return null;

  // If chart type is specified, use it
  if (chartType !== 'auto') {
    return buildChartConfig(data, columns, chartType as any);
  }

  // Auto-detect chart type based on data characteristics
  const numericColumns = columns.filter(col =>
    data.every(row => typeof row[col] === 'number' || row[col] === null)
  );

  const stringColumns = columns.filter(col =>
    data.every(row => typeof row[col] === 'string' || row[col] === null)
  );

  // If only 2 columns (one category, one value) and small dataset -> Pie chart
  if (columns.length === 2 && stringColumns.length === 1 && numericColumns.length === 1 && data.length <= 10) {
    return {
      type: 'pie',
      xKey: '',
      yKeys: [],
      dataKey: numericColumns[0],
      nameKey: stringColumns[0]
    };
  }

  // If we have a time/date column -> Line or Area chart
  const hasTimeColumn = columns.some(col =>
    col.toLowerCase().includes('date') ||
    col.toLowerCase().includes('time') ||
    col.toLowerCase().includes('year') ||
    col.toLowerCase().includes('month')
  );

  if (hasTimeColumn && numericColumns.length > 0) {
    const timeCol = columns.find(col =>
      col.toLowerCase().includes('date') ||
      col.toLowerCase().includes('time') ||
      col.toLowerCase().includes('year') ||
      col.toLowerCase().includes('month')
    ) || stringColumns[0];

    return {
      type: data.length > 20 ? 'area' : 'line',
      xKey: timeCol,
      yKeys: numericColumns
    };
  }

  // Multiple numeric columns -> Radar chart
  if (numericColumns.length >= 3 && data.length <= 15) {
    return {
      type: 'radar',
      xKey: stringColumns[0] || columns[0],
      yKeys: numericColumns
    };
  }

  // Default to bar chart
  const xKey = stringColumns[0] || columns[0];
  const yKeys = numericColumns.length > 0 ? numericColumns : [columns[1]];

  return {
    type: 'bar',
    xKey,
    yKeys
  };
}

function buildChartConfig(
  data: any[],
  columns: string[],
  type: 'bar' | 'line' | 'pie' | 'area' | 'radar' | 'scatter' | 'composed'
): ChartConfig {
  const numericColumns = columns.filter(col =>
    data.every(row => typeof row[col] === 'number' || row[col] === null)
  );
  const stringColumns = columns.filter(col =>
    data.every(row => typeof row[col] === 'string' || row[col] === null)
  );

  const xKey = stringColumns[0] || columns[0];
  const yKeys = numericColumns.length > 0 ? numericColumns : [columns[1]];

  if (type === 'pie') {
    return {
      type: 'pie',
      xKey: '',
      yKeys: [],
      dataKey: numericColumns[0] || columns[1],
      nameKey: stringColumns[0] || columns[0]
    };
  }

  return { type, xKey, yKeys };
}

function renderBarChart(data: any[], config: ChartConfig) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey={config.xKey}
          tick={{ fill: '#6b7280' }}
          tickLine={{ stroke: '#9ca3af' }}
        />
        <YAxis
          tick={{ fill: '#6b7280' }}
          tickLine={{ stroke: '#9ca3af' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        {config.yKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={COLORS[index % COLORS.length]}
            radius={[8, 8, 0, 0]}
            animationDuration={800}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function renderLineChart(data: any[], config: ChartConfig) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey={config.xKey}
          tick={{ fill: '#6b7280' }}
          tickLine={{ stroke: '#9ca3af' }}
        />
        <YAxis
          tick={{ fill: '#6b7280' }}
          tickLine={{ stroke: '#9ca3af' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        {config.yKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={COLORS[index % COLORS.length]}
            strokeWidth={3}
            dot={{ r: 5, fill: COLORS[index % COLORS.length] }}
            activeDot={{ r: 7 }}
            animationDuration={800}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function renderPieChart(data: any[], config: ChartConfig) {
  const chartData = data.map(row => ({
    name: row[config.nameKey!],
    value: row[config.dataKey!]
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={true}
          label={(entry) => `${entry.name}: ${entry.value}`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
          animationDuration={800}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function renderAreaChart(data: any[], config: ChartConfig) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <defs>
          {config.yKeys.map((key, index) => (
            <linearGradient key={key} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8} />
              <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.1} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey={config.xKey}
          tick={{ fill: '#6b7280' }}
          tickLine={{ stroke: '#9ca3af' }}
        />
        <YAxis
          tick={{ fill: '#6b7280' }}
          tickLine={{ stroke: '#9ca3af' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        {config.yKeys.map((key, index) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={COLORS[index % COLORS.length]}
            fillOpacity={1}
            fill={`url(#color${index})`}
            strokeWidth={2}
            animationDuration={800}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

function renderRadarChart(data: any[], config: ChartConfig) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey={config.xKey} tick={{ fill: '#6b7280' }} />
        <PolarRadiusAxis tick={{ fill: '#6b7280' }} />
        {config.yKeys.map((key, index) => (
          <Radar
            key={key}
            name={key}
            dataKey={key}
            stroke={COLORS[index % COLORS.length]}
            fill={COLORS[index % COLORS.length]}
            fillOpacity={0.6}
            animationDuration={800}
          />
        ))}
        <Legend />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function renderScatterChart(data: any[], config: ChartConfig) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey={config.xKey}
          tick={{ fill: '#6b7280' }}
          tickLine={{ stroke: '#9ca3af' }}
        />
        <YAxis
          tick={{ fill: '#6b7280' }}
          tickLine={{ stroke: '#9ca3af' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        {config.yKeys.map((key, index) => (
          <Scatter
            key={key}
            name={key}
            dataKey={key}
            fill={COLORS[index % COLORS.length]}
            animationDuration={800}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function renderComposedChart(data: any[], config: ChartConfig) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey={config.xKey}
          tick={{ fill: '#6b7280' }}
          tickLine={{ stroke: '#9ca3af' }}
        />
        <YAxis
          tick={{ fill: '#6b7280' }}
          tickLine={{ stroke: '#9ca3af' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        {config.yKeys.map((key, index) => {
          if (index === 0) {
            return (
              <Bar
                key={key}
                dataKey={key}
                fill={COLORS[index % COLORS.length]}
                radius={[8, 8, 0, 0]}
                animationDuration={800}
              />
            );
          } else {
            return (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={3}
                dot={{ r: 5 }}
                animationDuration={800}
              />
            );
          }
        })}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
