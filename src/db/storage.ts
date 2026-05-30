import { createMMKV } from "react-native-mmkv";
import type { StateStorage } from "zustand/middleware";

/**
 * Yerel KV depolama (offline-first). Hızlı, senkron, cihazda kalır.
 *
 * GİZLİLİK (PROJECT PROFILE §4.B):
 * Çocuğun adı gibi PII YALNIZCA bu cihaz-içi depoda tutulur.
 * Hiçbir uzak veritabanına senkron edilmez.
 */
export const storage = createMMKV({ id: "alif-storage" });

/** Zustand `persist` middleware'i için MMKV adaptörü. */
export const zustandMMKVStorage: StateStorage = {
  setItem: (name, value) => storage.set(name, value),
  getItem: (name) => storage.getString(name) ?? null,
  removeItem: (name) => {
    storage.remove(name);
  },
};
