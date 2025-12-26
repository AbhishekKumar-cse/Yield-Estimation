import { createFileRoute } from "@tanstack/react-router"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { TrendingUp, Zap } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"

export const Route = createFileRoute('/')({
  component: Index,
})

const cropDistribution = [
  { name: "Wheat", value: 45, fill: "var(--color-chart-1)" },
  { name: "Maize", value: 35, fill: "var(--color-chart-2)" },
]

function Index() {

  const {
    data: summaryData,
    isLoading
  } = useQuery({
    queryKey: ['summary'],
    queryFn: () => axios.get(`http://localhost:8000/dashboard/summary`)
      .then(res => res.data),
  })

  if (isLoading || !summaryData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Yield Analytics Dashboard</h1>
          <p className="text-muted-foreground">Real-time aggregated yield data across all farms</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Yield</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-foreground">{summaryData.avg_yield}</span>
                <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +12%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Peak Variability Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-foreground">{summaryData.variability[0].zone}</span>
                <span className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  {summaryData.variability[0].variability}%
                  <Zap className="w-4 h-4" />
                  High
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* Yield Trend */}
          <Card className="bg-card border-border w-full">
            <CardHeader>
              <CardTitle>Yield Trend ( Previous Years )</CardTitle>
              <CardDescription>Crop yield progression across all farms</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  wheat: { label: "Wheat", color: "var(--color-chart-1)" },
                  maize: { label: "Maize", color: "var(--color-chart-2)" },
                }}
                className="h-80 w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summaryData.yield_trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="year" stroke="var(--color-muted-foreground)" />
                    <YAxis stroke="var(--color-muted-foreground)" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="wheat"
                      stackId="1"
                      stroke="none"
                      fill="var(--color-chart-1)"
                      fillOpacity={0.8}
                    />
                    <Area
                      type="monotone"
                      dataKey="maize"
                      stackId="1"
                      stroke="none"
                      fill="var(--color-chart-2)"
                      fillOpacity={0.8}
                    />

                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Farm Comparison */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Farm Performance</CardTitle>
              <CardDescription>Yield vs Target for each farm</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  yield: { label: "Actual Yield", color: "var(--color-chart-1)" },
                  target: { label: "Target", color: "var(--color-muted)" },
                }}
                className="h-80 w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summaryData.farm_comparison} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
                    <YAxis stroke="var(--color-muted-foreground)" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="yield" fill="var(--color-chart-1)" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="target" fill="var(--color-muted)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Crop Distribution */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Crop Distribution</CardTitle>
              <CardDescription>Percentage of crops across all farms</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ChartContainer
                config={{
                  wheat: { label: "Wheat", color: "var(--color-chart-1)" },
                  maize: { label: "Maize", color: "var(--color-chart-2)" },
                  rice: { label: "Rice", color: "var(--color-chart-3)" },
                }}
                className="h-80 w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summaryData.crop_distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} ${value}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {cropDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Variability Analysis */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Yield Variability Analysis</CardTitle>
              <CardDescription>Hotspots with high yield variability</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  variability: { label: "Variability %", color: "var(--color-chart-2)" },
                  yield: { label: "Yield", color: "var(--color-chart-1)" },
                }}
                className="h-80 w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={summaryData.variability} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="zone" stroke="var(--color-muted-foreground)" />
                    <YAxis yAxisId="left" stroke="var(--color-muted-foreground)" />
                    <YAxis yAxisId="right" orientation="right" stroke="var(--color-muted-foreground)" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="variability"
                      stroke="var(--color-chart-2)"
                      strokeWidth={2}
                      dot={{ fill: "var(--color-chart-2)" }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="yield"
                      stroke="var(--color-chart-1)"
                      strokeWidth={2}
                      dot={{ fill: "var(--color-chart-1)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}