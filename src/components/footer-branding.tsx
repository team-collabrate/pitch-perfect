import { cn } from "~/lib/utils";

import { CollabrateLogo } from "~/components/collabrate-logo";

export function FooterBranding({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "border-border/60 text-muted-foreground flex items-center justify-center gap-2 border-t py-4 text-xs",
        className,
      )}
    >
      <span>{"Developed and Managed by"}</span>
      <span className="text-foreground/80 inline-flex items-center gap-2 font-medium">
        <CollabrateLogo
          className="h-5 w-5"
          aria-hidden="true"
          focusable="false"
        />
        <span>{"Collabrate"}</span>
      </span>
    </footer>
  );
}
