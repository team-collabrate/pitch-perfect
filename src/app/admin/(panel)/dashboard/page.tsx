import { BarChart3, LineChart, TrendingUp } from "lucide-react";

import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { requireManager } from "~/server/admin/session";

const metricCards = [
  {
    label: "Total revenue (month)",
    value: "₹8.4L",
    change: "+5.2% vs last month",
    isPositive: true,
  },
  {
    label: "Bookings (month)",
    value: "412",
    change: "+9.8%",
    isPositive: true,
  },
  {
    label: "Pending amount (today)",
    value: "₹62,000",
    change: "-3.4% vs yesterday",
    isPositive: false,
  },
  {
    label: "Upcoming bookings (today)",
    value: "21",
    change: "+4 till EOD",
    isPositive: true,
  },
];

const heatmap = Array.from({ length: 7 }).map((_, day) =>
  Array.from({ length: 4 }).map((_, block) => (day + block) % 5),
);

const trendLine = [70, 82, 60, 90, 110, 105, 130];
const maxTrendValue = Math.max(...trendLine);
const heightScale = [
  "h-10",
  "h-12",
  "h-16",
  "h-20",
  "h-24",
  "h-28",
  "h-32",
  "h-36",
];
const widthScale = [
  "w-1/4",
  "w-1/3",
  "w-2/5",
  "w-1/2",
  "w-3/5",
  "w-2/3",
  "w-3/4",
  "w-5/6",
  "w-full",
];

const getHeightClass = (value: number) => {
  const ratio = value / maxTrendValue;
  const index = Math.min(
    heightScale.length - 1,
    Math.max(0, Math.floor(ratio * heightScale.length)),
  );
  return heightScale[index]!;
};

const getWidthClass = (value: number) => {
  const ratio = value / 100;
  const index = Math.min(
    widthScale.length - 1,
    Math.max(0, Math.floor(ratio * widthScale.length)),
  );
  return widthScale[index]!;
};

export default async function DashboardPage() {
  await requireManager({ superOnly: true });

  return (
    <div className="space-y-6 pb-20">
      <section className="mx-auto grid max-w-xl grid-cols-2 gap-3 sm:gap-4">
        {metricCards.map((metric) => (
          <Card
            key={metric.label}
            className="border-border/60 bg-card/60 rounded-3xl p-4"
          >
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              {metric.label}
            </p>
            <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
            <p
              className={cn(
                "text-xs font-medium",
                metric.isPositive ? "text-emerald-500" : "text-red-500",
              )}
            >
              {metric.change}
            </p>
          </Card>
        ))}
      </section>

      <Card className="border-border/60 bg-card/60 space-y-4 rounded-3xl p-4">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs tracking-widest uppercase">
              Utilisation heatmap
            </p>
            <p className="text-lg font-semibold">Slot density</p>
          </div>
          <BarChart3 className="text-muted-foreground h-5 w-5" />
        </header>
        <div className="grid grid-cols-7 gap-2">
          {heatmap.map((blocks, day) => (
            <div key={day} className="space-y-1">
              {blocks.map((value, block) => (
                <div
                  key={`${day}-${block}`}
                  className={cn(
                    "h-6 rounded-full",
                    value >= 4
                      ? "bg-primary"
                      : value >= 2
                        ? "bg-primary/60"
                        : "bg-muted",
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-border/60 bg-card/60 space-y-4 rounded-3xl p-4">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs tracking-widest uppercase">
              Week over week
            </p>
            <p className="text-lg font-semibold">Revenue this week</p>
          </div>
          <TrendingUp className="text-muted-foreground h-5 w-5" />
        </header>
        <div className="relative h-40">
          <svg
            className="h-full w-full"
            viewBox="0 0 280 160"
            preserveAspectRatio="none"
          >
            {/* Previous week line */}
            <polyline
              points={trendLine
                .map((v, i) => `${i * 40},${160 - (v / maxTrendValue) * 140}`)
                .join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted-foreground/40"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* This week line */}
            <polyline
              points={trendLine
                .map(
                  (v, i) =>
                    `${i * 40},${160 - ((v + 15) / maxTrendValue) * 140}`,
                )
                .join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-primary"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="text-muted-foreground flex justify-between text-xs font-medium">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <span key={index}>{day}</span>
          ))}
        </div>
      </Card>

      <Card className="border-border/60 bg-card/60 rounded-3xl p-4">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs tracking-widest uppercase">
              Conversion
            </p>
            <p className="text-lg font-semibold">Verification success</p>
          </div>
          <LineChart className="text-muted-foreground h-5 w-5" />
        </header>
        <div className="mt-4 space-y-3">
          {["Advance", "Full Payment", "Coupons"].map((channel, index) => (
            <div key={channel} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{channel}</span>
                <span className="font-semibold">{80 - index * 8}%</span>
              </div>
              <div className="bg-muted h-2 rounded-full">
                <div
                  className={cn(
                    "bg-primary h-2 rounded-full",
                    getWidthClass(80 - index * 8),
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
