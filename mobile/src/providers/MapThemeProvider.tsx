import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadMapTheme, saveMapTheme, type MapTheme } from '../mapTheme';

type MapThemeContextValue = {
  mapTheme: MapTheme;
  setMapTheme: (theme: MapTheme) => void;
  toggleMapTheme: () => void;
};

const MapThemeContext = createContext<MapThemeContextValue | null>(null);

export function MapThemeProvider({ children }: { children: ReactNode }) {
  const [mapTheme, setMapThemeState] = useState<MapTheme>('dark');

  useEffect(() => {
    void loadMapTheme().then(setMapThemeState);
  }, []);

  const setMapTheme = useCallback((theme: MapTheme) => {
    setMapThemeState(theme);
    void saveMapTheme(theme);
  }, []);

  const toggleMapTheme = useCallback(() => {
    setMapThemeState((prev) => {
      const next: MapTheme = prev === 'dark' ? 'light' : 'dark';
      void saveMapTheme(next);
      return next;
    });
  }, []);

  return (
    <MapThemeContext.Provider value={{ mapTheme, setMapTheme, toggleMapTheme }}>
      {children}
    </MapThemeContext.Provider>
  );
}

export function useMapTheme(): MapThemeContextValue {
  const ctx = useContext(MapThemeContext);
  if (!ctx) throw new Error('useMapTheme must be used within MapThemeProvider');
  return ctx;
}
