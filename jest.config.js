/**
 * Test kurulumu.
 *
 * Sınanan şey ekranlar değil, sessizce bozulduğunda kimsenin fark etmeyeceği
 * mantık: seviye eşlemesi, ilerleme göçü, ders kurgusu, aralıklı tekrar,
 * freemium ve ses tablolarının gerçek dosyalarla tutarlılığı.
 */
module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    // Görsel/ses varlıkları testte yüklenmez; mantık sınanıyor, dosya değil.
    "\\.(webp|png|jpg|jpeg|gif|svg|mp3|ttf|otf)$": "<rootDir>/src/__tests__/assetStub.js",
    "^@/assets/(.*)$": "<rootDir>/src/__tests__/assetStub.js",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  modulePathIgnorePatterns: [],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))",
  ],
};
