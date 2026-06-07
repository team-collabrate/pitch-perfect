import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSlotTime(time: string): string {
  const [hoursStr, minutesStr = "00"] = time.split(":");
  let hours = Number(hoursStr);
  if (Number.isNaN(hours)) {
    return time;
  }
  if (hours === 24) hours = 0;
  const period = hours >= 12 ? "PM" : "AM";
  const normalizedHour = hours % 12 || 12;
  const minutes = minutesStr.padStart(2, "0");
  return `${normalizedHour}:${minutes} ${period}`;
}

export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const [hoursStr, minutesStr = "00"] = time.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return time;
  }

  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const nextHours = Math.floor(normalized / 60);
  const nextMinutes = normalized % 60;

  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
}

export function formatSlotRange(from: string, to: string): string {
  return `${formatSlotTime(from)} - ${formatSlotTime(to)}`;
}
