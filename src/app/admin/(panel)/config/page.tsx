import { Settings2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { requireManager } from "~/server/admin/session";
import { SlotManager } from "./slot-manager";

const toggles = [
  {
    label: "Maintenance mode",
    desc: "Temporarily pause bookings",
    enabled: false,
  },
  {
    label: "Full payment only",
    desc: "Skip advance option",
    enabled: true,
  },
  {
    label: "Auto-assign coupons",
    desc: "Match best coupon automatically",
    enabled: true,
  },
];

export default async function ConfigPage() {
  await requireManager();

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center gap-3">
        <Settings2 className="bg-muted h-10 w-10 rounded-2xl p-2" />
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            System config
          </p>
          <h1 className="text-2xl font-semibold">Config</h1>
        </div>
      </header>

      <div className="space-y-3">
        {toggles.map((toggle) => (
          <Card
            key={toggle.label}
            className="border-border/60 bg-card/60 flex flex-row items-center justify-between rounded-3xl px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold">{toggle.label}</p>
              <p className="text-muted-foreground text-xs">{toggle.desc}</p>
            </div>
            <button
              type="button"
              aria-label={`Toggle ${toggle.label}`}
              className={cn(
                "flex h-8 w-14 items-center rounded-full px-1 transition",
                toggle.enabled ? "bg-primary" : "bg-muted",
              )}
            >
              <span
                className={cn(
                  "bg-background h-6 w-6 rounded-full shadow transition",
                  toggle.enabled ? "translate-x-6" : "translate-x-0",
                )}
              />
            </button>
          </Card>
        ))}
      </div>

      <SlotManager />

      <Link href="/admin/config/gallery">
        <Card className="border-border/60 bg-card/60 rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <ImageIcon className="text-primary h-5 w-5" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Manage Gallery</p>
              <p className="text-muted-foreground text-xs">
                Edit gallery images and details
              </p>
            </div>
            <Button className="rounded-2xl" variant="secondary" size="sm">
              Open
            </Button>
          </div>
        </Card>
      </Link>

      <Link href="/admin/config/banner">
        <Card className="border-border/60 bg-card/60 rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <ImageIcon className="text-primary h-5 w-5" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Manage Banner</p>
              <p className="text-muted-foreground text-xs">
                Edit banner images and details
              </p>
            </div>
            <Button className="rounded-2xl" variant="secondary" size="sm">
              Open
            </Button>
          </div>
        </Card>
      </Link>
    </div>
  );
}
