"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "pitch-perfect-phone";

type PhoneContextValue = {
  phoneNumber: string;
  setPhoneNumber: (number: string) => void;
  clearPhoneNumber: () => void;
  isHydrated: boolean;
};

const PhoneContext = createContext<PhoneContextValue | undefined>(undefined);

export function PhoneProvider({ children }: { children: React.ReactNode }) {
  const [phoneNumber, setPhoneNumberState] = useState<string>("");
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem(STORAGE_KEY)
          : null;
      if (stored) {
        setPhoneNumberState(stored);
      }
    } catch (error) {
      console.error("Failed to read phone number from storage", error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Persist to localStorage when changed
  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (typeof window === "undefined") return;
      if (phoneNumber) {
        localStorage.setItem(STORAGE_KEY, phoneNumber);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error("Failed to persist phone number", error);
    }
  }, [phoneNumber, isHydrated]);

  const setPhoneNumber = useCallback((number: string) => {
    setPhoneNumberState(number);
  }, []);

  const clearPhoneNumber = useCallback(() => {
    setPhoneNumberState("");
  }, []);

  const value = useMemo<PhoneContextValue>(
    () => ({
      phoneNumber,
      setPhoneNumber,
      clearPhoneNumber,
      isHydrated,
    }),
    [phoneNumber, setPhoneNumber, clearPhoneNumber, isHydrated],
  );

  return (
    <PhoneContext.Provider value={value}>{children}</PhoneContext.Provider>
  );
}

export function usePhone() {
  const context = useContext(PhoneContext);
  if (!context) {
    throw new Error("usePhone must be used within PhoneProvider");
  }
  return context;
}
