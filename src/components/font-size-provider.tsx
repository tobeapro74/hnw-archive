"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export type FontSizeKey = "small" | "default" | "large" | "xlarge" | "xxlarge";

const FONT_SIZE_MAP: Record<FontSizeKey, number> = {
  small: 14,
  default: 15,
  large: 17,
  xlarge: 19,
  xxlarge: 21,
};

const FONT_SIZE_LABELS: Record<FontSizeKey, string> = {
  small: "작게",
  default: "기본",
  large: "크게",
  xlarge: "아주 크게",
  xxlarge: "최대",
};

const FONT_SIZE_KEYS: FontSizeKey[] = ["small", "default", "large", "xlarge", "xxlarge"];

const STORAGE_KEY = "hnw-font-size";

interface FontSizeContextValue {
  fontSizeKey: FontSizeKey;
  fontSize: number;
  setFontSizeKey: (key: FontSizeKey) => void;
  fontSizeMap: typeof FONT_SIZE_MAP;
  fontSizeLabels: typeof FONT_SIZE_LABELS;
  fontSizeKeys: typeof FONT_SIZE_KEYS;
}

const FontSizeContext = createContext<FontSizeContextValue | null>(null);

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSizeKey, setFontSizeKeyState] = useState<FontSizeKey>("default");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as FontSizeKey | null;
    if (saved && saved in FONT_SIZE_MAP) {
      setFontSizeKeyState(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${FONT_SIZE_MAP[fontSizeKey]}px`;
  }, [fontSizeKey]);

  const setFontSizeKey = useCallback((key: FontSizeKey) => {
    setFontSizeKeyState(key);
    localStorage.setItem(STORAGE_KEY, key);
  }, []);

  return (
    <FontSizeContext.Provider
      value={{
        fontSizeKey,
        fontSize: FONT_SIZE_MAP[fontSizeKey],
        setFontSizeKey,
        fontSizeMap: FONT_SIZE_MAP,
        fontSizeLabels: FONT_SIZE_LABELS,
        fontSizeKeys: FONT_SIZE_KEYS,
      }}
    >
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const ctx = useContext(FontSizeContext);
  if (!ctx) throw new Error("useFontSize must be used within FontSizeProvider");
  return ctx;
}
