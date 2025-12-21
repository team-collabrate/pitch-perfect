import type { SVGProps } from "react";

export function CollabrateLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 128 128"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Collabrate"
      role="img"
      {...props}
    >
      <rect x="24" y="26" width="80" height="22" rx="11" fill="currentColor" />
      <rect x="20" y="54" width="88" height="26" rx="13" fill="currentColor" />
      <rect x="26" y="86" width="76" height="22" rx="11" fill="currentColor" />
    </svg>
  );
}
