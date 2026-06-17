import Svg, { Circle, G, Path, Polygon } from "react-native-svg";

/**
 * İslami görsel dil — ödül anları için motifler (jenerik yıldız/parıltı yerine).
 * Saf SVG (react-native-svg), animasyon dışarıda Reanimated transform ile yapılır.
 * Motifler: hilal (crescent), 8-köşeli girih yıldızı (Khatim/Rub el Hizb),
 * 4-köşeli parıltı, fener (fanous) ve büyük ödül amblemi.
 */

// Çok-köşeli yıldız nokta dizisi üretir (spikes uçlu; dış R, iç r yarıçap).
function starPoints(cx: number, cy: number, spikes: number, R: number, r: number, rotDeg = -90): string {
  const pts: string[] = [];
  const step = 180 / spikes; // derece
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = ((rotDeg + i * step) * Math.PI) / 180;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

/** 8-köşeli girih yıldızı (Khatim) — en tanınır İslami geometrik motif. */
export function Star8({ size = 26, color = "#F5A524", inner = 0.45 }: { size?: number; color?: string; inner?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Polygon points={starPoints(50, 50, 8, 48, 48 * inner)} fill={color} />
    </Svg>
  );
}

/** 4-köşeli parıltı (shimmer) — ince uçlu, ışıltı hissi. */
export function Sparkle4({ size = 20, color = "#FFE08A" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Polygon points={starPoints(50, 50, 4, 48, 11)} fill={color} />
    </Svg>
  );
}

/** Hilal (crescent) — dış daire arkı + iç eliptik ark ile oyulmuş. */
export function Crescent({ size = 24, color = "#2E8B9E" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M52 6 A46 46 0 1 0 52 94 A30 46 0 0 1 52 6 Z" fill={color} />
    </Svg>
  );
}

/** Küçük fener (fanous) — kutlama dekoru için stilize. */
export function Lantern({ size = 26, color = "#F5A524", glow = "#FFE6A8" }: { size?: number; color?: string; glow?: string }) {
  return (
    <Svg width={size} height={size * 1.5} viewBox="0 0 60 90">
      {/* asma halkası */}
      <Path d="M30 4 v8" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={30} cy={4} r={3.2} fill="none" stroke={color} strokeWidth={2.4} />
      {/* üst kapak */}
      <Path d="M18 16 h24 l-4 8 h-16 z" fill={color} />
      {/* gövde (altıgen) */}
      <Path d="M16 26 h28 l5 12 v18 l-5 12 h-28 l-5 -12 v-18 z" fill={glow} stroke={color} strokeWidth={3} />
      {/* iç ışık çizgileri */}
      <Path d="M30 30 v40" stroke={color} strokeWidth={2} opacity={0.5} />
      <Path d="M22 34 v30 M38 34 v30" stroke={color} strokeWidth={1.6} opacity={0.35} />
      {/* alt püskül */}
      <Path d="M30 78 v8" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={30} cy={87} r={3} fill={color} />
    </Svg>
  );
}

/**
 * Büyük ödül amblemi — katmanlı altın girih yıldızı + ortada hilal & küçük yıldız.
 * Celebration'ın merkezindeki jenerik yıldız PNG'sinin yerine geçer.
 */
export function RewardEmblem({ size = 140 }: { size?: number }) {
  const gold = "#F5A524";
  const goldDeep = "#D9821A";
  const cream = "#FFF4DA";
  const teal = "#2E8B9E";
  const cx = 50;
  const cy = 50;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* dış katman (koyu altın) — 22.5° döndürülmüş ikinci yıldızla 16-köşe hissi */}
      <Polygon points={starPoints(cx, cy, 8, 48, 20, -90 + 22.5)} fill={goldDeep} />
      <Polygon points={starPoints(cx, cy, 8, 47, 20)} fill={gold} />
      {/* iç krem yıldız (derinlik) */}
      <Polygon points={starPoints(cx, cy, 8, 30, 13)} fill={cream} opacity={0.95} />
      {/* merkez disk */}
      <Circle cx={cx} cy={cy} r={17} fill={teal} />
      <Circle cx={cx} cy={cy} r={17} fill="none" stroke={cream} strokeWidth={2} />
      {/* ortada hilal + küçük yıldız (klasik amblem) */}
      <G>
        <Path d="M53 40 A11 11 0 1 0 53 60 A7.5 11 0 0 1 53 40 Z" fill={cream} />
        <Polygon points={starPoints(58, 50, 5, 5.5, 2.4)} fill={cream} />
      </G>
    </Svg>
  );
}

/** Motif türü — konfeti/patlama için rastgele seçim. */
export type MotifKind = "star8" | "crescent" | "sparkle4";

export function Motif({ kind, size, color }: { kind: MotifKind; size: number; color: string }) {
  if (kind === "crescent") return <Crescent size={size} color={color} />;
  if (kind === "sparkle4") return <Sparkle4 size={size} color={color} />;
  return <Star8 size={size} color={color} />;
}

/** Ödül paleti — İslami sıcaklık (altın, teal, zümrüt, lacivert, krem-altın). */
export const REWARD_COLORS = ["#F5A524", "#2E8B9E", "#2FA869", "#3E7CC4", "#E0A93B", "#7FC5D2"];
