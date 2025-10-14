import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

interface AnalyticsDashboardProps {
  moduleType: "procurement" | "processing" | "logistics" | "warehouse" | "compliance";
  data?: any;
}

export default function AnalyticsDashboard({ moduleType, data }: AnalyticsDashboardProps) {
  const procurementData = [
    { month: "Jan", quantity: 1200, value: 48000 },
    { month: "Feb", quantity: 1500, value: 60000 },
    { month: "Mar", quantity: 1800, value: 72000 },
    { month: "Apr", quantity: 1600, value: 64000 },
    { month: "May", quantity: 2000, value: 80000 },
    { month: "Jun", quantity: 2200, value: 88000 },
  ];

  const qualityDistribution = [
    { name: "Grade A", value: 45 },
    { name: "Grade B", value: 30 },
    { name: "Grade C", value: 20 },
    { name: "Grade D", value: 5 },
  ];

  const performanceData = [
    { day: "Mon", efficiency: 85, output: 1200 },
    { day: "Tue", efficiency: 88, output: 1350 },
    { day: "Wed", efficiency: 82, output: 1100 },
    { day: "Thu", efficiency: 90, output: 1400 },
    { day: "Fri", efficiency: 87, output: 1300 },
    { day: "Sat", efficiency: 85, output: 1250 },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Procurement Trends</CardTitle>
          <CardDescription>Quantity and value over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              quantity: { label: "Quantity (kg)", color: "hsl(var(--primary))" },
              value: { label: "Value ($)", color: "hsl(var(--secondary))" },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={procurementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="quantity" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--secondary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quality Grade Distribution</CardTitle>
          <CardDescription>Tobacco quality breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              gradeA: { label: "Grade A", color: COLORS[0] },
              gradeB: { label: "Grade B", color: COLORS[1] },
              gradeC: { label: "Grade C", color: COLORS[2] },
              gradeD: { label: "Grade D", color: COLORS[3] },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={qualityDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {qualityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Performance</CardTitle>
          <CardDescription>Efficiency and output metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              efficiency: { label: "Efficiency (%)", color: "hsl(var(--primary))" },
              output: { label: "Output (kg)", color: "hsl(var(--accent))" },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="efficiency" fill="hsl(var(--primary))" />
                <Bar dataKey="output" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
