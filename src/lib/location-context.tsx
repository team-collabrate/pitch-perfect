"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Coords = { lat: number; lng: number; accuracy?: number };

type LocationContextValue = {
  coords: Coords;
  setCoords: (c: Coords) => void;
  isLoading: boolean;
  error: string | null;
  permission: "unknown" | "granted" | "denied";
  fallback: Coords;
};

const FALLBACK: Coords = { lat: 9.5097955, lng: 78.1113851 };

const LocationContext = createContext<LocationContextValue | undefined>(
  undefined,
);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [coords, setCoordsState] = useState<Coords>(FALLBACK);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<
    "unknown" | "granted" | "denied"
  >("unknown");

  useEffect(() => {
    if (typeof window === "undefined" || !navigator?.geolocation) {
      setIsLoading(false);
      setError("Geolocation not available");
      setPermission("denied");
      return;
    }

    let cancelled = false;
    let permStatus: any = null;

    // Try to observe permission state when available
    try {
      // navigator.permissions may not be available in all browsers
      // @ts-ignore
      navigator.permissions
        ?.query?.({ name: "geolocation" })
        .then((s: any) => {
          permStatus = s;
          const update = () => {
            if (permStatus.state === "granted") setPermission("granted");
            else if (permStatus.state === "denied") setPermission("denied");
            else setPermission("unknown");
          };
          update();
          permStatus.addEventListener?.("change", update);
        })
        .catch(() => {});
    } catch (e) {
      // ignore
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setCoordsState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setIsLoading(false);
        setPermission("granted");
      },
      (err) => {
        if (cancelled) return;
        setError(err?.message ?? "Failed to get location");
        setCoordsState(FALLBACK);
        setIsLoading(false);
        setPermission("denied");
      },
      { enableHighAccuracy: true, maximumAge: 1000 * 60 * 5, timeout: 10000 },
    );

    return () => {
      cancelled = true;
      try {
        permStatus?.removeEventListener?.("change", () => {});
      } catch (e) {
        // noop
      }
    };
  }, []);

  const setCoords = useCallback((c: Coords) => setCoordsState(c), []);

  const value = useMemo<LocationContextValue>(() => {
    return {
      coords,
      setCoords,
      isLoading,
      error,
      permission,
      fallback: FALLBACK,
    };
  }, [coords, setCoords, isLoading, error, permission]);

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useLocation must be used within LocationProvider");
  }
  return ctx;
}
