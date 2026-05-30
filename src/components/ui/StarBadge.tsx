import { Image } from "expo-image";
import { Text, View } from "react-native";

import { images } from "@/lib/images";

/** HUD yıldız/skor rozeti (oyun üst-bar hissi). */
export function StarBadge({ count }: { count: number }) {
  return (
    <View
      className="flex-row items-center gap-1 rounded-full bg-white/80 px-3 py-1"
      style={{
        shadowColor: "#1462B5",
        shadowOpacity: 0.18,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
      }}
    >
      <Image source={images.star} style={{ width: 22, height: 22 }} contentFit="contain" />
      <Text className="font-display text-base font-extrabold text-ink">{count}</Text>
    </View>
  );
}
