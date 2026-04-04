import { Loader } from "lucide-react";

import { cn } from "~/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader className={cn("h-6 w-6 animate-spin", className)} />;
}
