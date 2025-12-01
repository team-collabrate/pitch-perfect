"use client";

import { Card } from "~/components/ui/card";
import { useLocation } from "~/lib/location-context";

interface LocationWidgetProps {
  title?: string;
  address: string;
  hours?: string;
}

export function LocationWidget({
  title = "Pitch Perfect",
  address = "12/4A, Pitch Perfect Turf, Aruppukottai Main Road, Tamil Nadu.",
  hours,
}: LocationWidgetProps) {
  const { coords } = useLocation();

  return (
    <Card className="overflow-hidden p-0">
      <div className="aspect-video">
        <iframe
          title="Location map"
          src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=17&output=embed`}
          className="h-full w-full border-0"
          loading="lazy"
          allowFullScreen
        />
      </div>
      <div className="text-muted-foreground p-4 text-sm">
        <p>{address}</p>
        {title && <p className="text-foreground mt-2 font-medium">{title}</p>}
        {hours && <p className="text-foreground mt-2">{hours}</p>}
      </div>
    </Card>
  );
}
