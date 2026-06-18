import { HistoryItem } from "../types";

const HISTORY_KEY = 'copycraft_history_v1';
const MAX_HISTORY_ITEMS = 50;

export const getHistory = (): HistoryItem[] => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const saveHistoryItem = (item: HistoryItem): HistoryItem[] => {
  try {
    const current = getHistory();
    // Remove if exists (update to top)
    const filtered = current.filter(i => i.id !== item.id);

    const updated = [item, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to save history", e);
    return [];
  }
};

export const deleteHistoryItem = (id: string): HistoryItem[] => {
  try {
    const current = getHistory();
    const updated = current.filter(i => i.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to delete history item", e);
    return [];
  }
};

export const clearHistory = (): void => {
  localStorage.removeItem(HISTORY_KEY);
};

// Helper to generate a title from text
export const generateTitle = (text: string): string => {
  return text.length > 30 ? text.substring(0, 30) + '...' : text;
};
