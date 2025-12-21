import type { ReactNode } from "react";

import { BottomNav } from "~/components/bottom-nav";

export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1 overflow-y-auto pt-2 pb-24">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
