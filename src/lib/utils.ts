import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhoneNumber(value: string) {
  // Remove all non-digit characters except the + sign at the beginning
  let phoneNumber = value;

  // Remove the +91 prefix if it exists to store only the 10-digit number
  if (phoneNumber.startsWith("+91")) {
    phoneNumber = phoneNumber.substring(3);
  }

  // Remove all non-digit characters
  phoneNumber = phoneNumber.replace(/\D/g, "");

  // Limit to 10 digits
  phoneNumber = phoneNumber.substring(0, 10);

  return phoneNumber;
}

export function validatePhoneNumber(phoneNumber: string) {
  // Basic validation for Indian phone numbers (10 digits)
  return /^\d{10}$/.test(phoneNumber);
}

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

export function formatTimeAgo(dateString: string | null | undefined): string {
  if (!dateString) return "Never";

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
}
