/** @type {import('tailwindcss').Config} */
// Çocuk dostu, sıcak ve sakin bir palet. Tasarım ekibi style tile'ları gelince
// bu token'lar güncellenecek — şimdilik placeholder olarak çalışır.
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Marka
        primary: {
          DEFAULT: "#208AEF", // ana mavi (splash ile uyumlu)
          soft: "#E6F4FE",
        },
        // Sıcak vurgu (ödül, kutlama)
        accent: {
          DEFAULT: "#F5A524",
          soft: "#FFF3DC",
        },
        // Başarı / yumuşak geri bildirim (cezalandırma yok)
        success: "#3FB984",
        // Yüzeyler
        surface: "#FFFFFF",
        canvas: "#FAF7F0", // sıcak kağıt tonu
        ink: "#2A2A33", // metin
        muted: "#8A8A99",
      },
      fontFamily: {
        // Yüklü oyun fontları (bkz. _layout.tsx useFonts)
        display: ["Fredoka_700Bold"],
        "display-semibold": ["Fredoka_600SemiBold"],
        "display-medium": ["Fredoka_500Medium"],
        body: ["Nunito_600SemiBold"],
        "body-bold": ["Nunito_700Bold"],
        "body-regular": ["Nunito_400Regular"],
      },
      borderRadius: {
        xl: "20px",
        "2xl": "28px",
        "3xl": "36px",
      },
    },
  },
  plugins: [],
};
