"use client";

import { LineChart, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { enIN, ta } from "date-fns/locale";

import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";

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

const getWidthClass = (value: number) => {
  const ratio = value / 100;
  const index = Math.min(
    widthScale.length - 1,
    Math.max(0, Math.floor(ratio * widthScale.length)),
  );
  return widthScale[index]!;
};

function formatCurrency(amount: number): string {
  const rupees = amount / 100;

  if (rupees >= 100000) {
    return `₹${(rupees / 100000).toFixed(1)}L`;
  } else if (rupees >= 1000) {
    return `₹${(rupees / 1000).toFixed(1)}K`;
  }

  return `₹${Math.round(rupees)}`;
}

function calculatePercentageChange(current: number, previous: number): string {
  if (current === 0 && previous === 0) return "0%";
  if (previous === 0) return "+100%";
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
}

export default function DashboardPage() {
  const { language } = useLanguage();
  const strings = useMemo(() => allTranslations.admin[language], [language]);
  const locale = language === "ta" ? ta : enIN;
  const { data: dashboardData, isLoading } =
    api.admin.dashboardSummary.useQuery();

  if (isLoading || !dashboardData) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  // Calculate metrics
  const revenueChange = calculatePercentageChange(
    dashboardData.metrics.currentMonth.revenue,
    dashboardData.metrics.lastMonth.revenue,
  );
  const bookingsChange = calculatePercentageChange(
    dashboardData.metrics.currentMonth.bookings,
    dashboardData.metrics.lastMonth.bookings,
  );
  const pendingChange = calculatePercentageChange(
    dashboardData.metrics.today.pendingAmount,
    dashboardData.metrics.yesterday.pendingAmount,
  );

  const metricCards = [
    {
      label: strings.revenueMonth,
      value: formatCurrency(dashboardData.metrics.currentMonth.revenue),
      change: `${revenueChange} ${strings.vsLastMonth}`,
      isPositive:
        dashboardData.metrics.currentMonth.revenue >=
        dashboardData.metrics.lastMonth.revenue,
    },
    {
      label: strings.bookingsMonth,
      value: dashboardData.metrics.currentMonth.bookings.toString(),
      change: `${bookingsChange} ${strings.vsLastMonth}`,
      isPositive:
        dashboardData.metrics.currentMonth.bookings >=
        dashboardData.metrics.lastMonth.bookings,
    },
    {
      label: strings.pendingToday,
      value: formatCurrency(dashboardData.metrics.today.pendingAmount),
      change: `${pendingChange} ${strings.vsYesterday}`,
      isPositive:
        dashboardData.metrics.today.pendingAmount <=
        dashboardData.metrics.yesterday.pendingAmount,
    },
    {
      label: strings.upcomingToday,
      value: dashboardData.metrics.today.upcomingBookings.toString(),
      change: strings.tillEOD,
      isPositive: true,
    },
  ];

  // Process trend data for last 7 days
  const heatmapDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split("T")[0];
  });

  // Process trend data for last 7 days
  const trendLine = dashboardData.trends.last7Days.map((d) => d.revenue);
  const maxTrendValue = Math.max(...trendLine, 1);

  // Calculate conversion rates
  const totalConversions = dashboardData.conversions.reduce(
    (sum, c) => sum + c.count,
    0,
  );
  const conversionData = [
    {
      label: strings.advance,
      percentage:
        totalConversions > 0
          ? Math.round(
              ((dashboardData.conversions.find(
                (c) => c.status === "advancePaid",
              )?.count ?? 0) /
                totalConversions) *
                100,
            )
          : 0,
    },
    {
      label: strings.fullPayment,
      percentage:
        totalConversions > 0
          ? Math.round(
              ((dashboardData.conversions.find((c) => c.status === "fullPaid")
                ?.count ?? 0) /
                totalConversions) *
                100,
            )
          : 0,
    },
    {
      label: strings.pending,
      percentage:
        totalConversions > 0
          ? Math.round(
              (((dashboardData.conversions.find(
                (c) => c.status === "advancePending",
              )?.count ?? 0) +
                (dashboardData.conversions.find(
                  (c) => c.status === "fullPending",
                )?.count ?? 0)) /
                totalConversions) *
                100,
            )
          : 0,
    },
  ];

  return (
    <div className="space-y-6 pb-20">
      <section className="mx-auto grid max-w-xl grid-cols-2 gap-3 sm:gap-4">
        {metricCards.map((metric) => (
          <Card
            key={metric.label}
            className="border-border/60 bg-card/60 flex flex-col justify-between rounded-3xl p-4"
          >
            <div>
              <p className="text-muted-foreground text-xs tracking-wide uppercase">
                {metric.label}
              </p>
              <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
            </div>
            <p
              className={cn(
                "mt-2 text-xs font-medium",
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
              {strings.last7Days}
            </p>
            <p className="text-lg font-semibold">{strings.dashboardTitle}</p>
          </div>
          <TrendingUp className="text-muted-foreground h-5 w-5" />
        </header>
        <div className="relative h-40">
          <svg
            className="h-full w-full"
            viewBox="0 0 280 160"
            preserveAspectRatio="none"
          >
            {trendLine.length > 0 && (
              <polyline
                points={trendLine
                  .map((v, i) => `${i * 40},${160 - (v / maxTrendValue) * 140}`)
                  .join(" ")}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-primary"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </div>
        <div className="text-muted-foreground flex justify-between text-xs font-medium">
          {heatmapDates.map((date, index) => {
            const dayName = format(parseISO(date!), "EEEEE", { locale });
            return <span key={index}>{dayName}</span>;
          })}
        </div>
      </Card>

      <Card className="border-border/60 bg-card/60 rounded-3xl p-4">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs tracking-widest uppercase">
              {strings.paymentStatus}
            </p>
            <p className="text-lg font-semibold">
              {strings.bookingConversions}
            </p>
          </div>
          <LineChart className="text-muted-foreground h-5 w-5" />
        </header>
        <div className="mt-4 space-y-3">
          {conversionData.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{item.label}</span>
                <span className="font-semibold">{item.percentage}%</span>
              </div>
              <div className="bg-muted h-2 rounded-full">
                <div
                  className={cn(
                    "bg-primary h-2 rounded-full",
                    getWidthClass(item.percentage),
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
