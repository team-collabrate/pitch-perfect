"use client";

import { Button } from "~/components/ui/button";

export default function Home() {
  return (
    <div className="">
      hello world
      <Button onClick={async () => {
        const response = await fetch('/api/cron/setSlots');
        const data = await response.json();
        console.log(data);
      }}>set slots</Button>
    </div>
  );
}
