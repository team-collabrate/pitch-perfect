import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSlotTime(time: string): string {
  const [hoursStr, minutesStr = "00"] = time.split(":")
  const hours = Number(hoursStr)
  if (Number.isNaN(hours)) {
    return time
  }
  const period = hours >= 12 ? "PM" : "AM"
  const normalizedHour = hours % 12 || 12
  const minutes = minutesStr.padStart(2, "0")
  return `${normalizedHour}:${minutes} ${period}`
}

export function formatSlotRange(from: string, to: string): string {
  return `${formatSlotTime(from)} - ${formatSlotTime(to)}`
}
