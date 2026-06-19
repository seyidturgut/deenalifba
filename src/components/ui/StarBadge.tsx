import { Text, View } from "react-native";

/**
 * "Öğrenilen harf" rozeti (HUD). Sohail #5: sayaç ne saydığını GÖRSELLE belli etsin.
 * Jenerik yıldız yerine Arap harfi (ا) madalyonu + "öğrenilen/toplam" (ör. 5/28) →
 * çocuk/ebeveyn "bu ne sayacı?" diye düşünmez: alfabe ilerlemesi.
 */
export function StarBadge({ count, total }: { count: number; total?: number }) {
  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full bg-white/85 py-1 pl-1 pr-3"
      style={{ shadowColor: "#1462B5", shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 }}
    >
      {/* Arap harfi madalyonu — "harf öğrenme" simgesi */}
      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: "#F5A524", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: "Amiri_700Bold", fontSize: 16, color: "#FFFFFF", marginTop: -1 }}>ا</Text>
      </View>
      <Text className="font-display text-base font-extrabold text-ink">{total ? `${count}/${total}` : count}</Text>
    </View>
  );
}
