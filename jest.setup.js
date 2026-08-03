/**
 * Test ortamı.
 *
 * MMKV ve ses native modül istiyor; testler mantığı sınıyor, cihazı değil.
 * MMKV yerine bellekte bir karşılık veriyoruz — kalıcılık davranışı (yaz/oku)
 * korunuyor, native bağımlılık kalkıyor.
 */
jest.mock("react-native-mmkv", () => {
  const store = new Map();
  return {
    createMMKV: () => ({
      set: (k, v) => store.set(k, String(v)),
      getString: (k) => (store.has(k) ? store.get(k) : undefined),
      delete: (k) => store.delete(k),
      clearAll: () => store.clear(),
      getAllKeys: () => [...store.keys()],
    }),
  };
});

jest.mock("expo-audio", () => ({
  createAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn(), seekTo: jest.fn(), remove: jest.fn(), volume: 1 }),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
  requestRecordingPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  useAudioRecorder: () => ({}),
  RecordingPresets: { HIGH_QUALITY: {} },
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {},
  NotificationFeedbackType: {},
}));
