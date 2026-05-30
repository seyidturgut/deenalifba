import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { haptics } from "@/lib/haptics";
import { playSfx } from "@/lib/sfx";

/**
 * Yapboz: harf 2×2 parçaya bölünür. Çocuk parçaları tepsiden sürükleyip
 * doğru yere oturtur. Yanlış bırakışta parça nazikçe yerine döner (ceza yok).
 * Tüm parçalar yerleşince onComplete tetiklenir.
 */
const COLS = 2;
const ROWS = 2;
const BOARD = 190; // tahta (kare) kenarı
const TILE = BOARD / COLS; // 95
const GAP = 24; // tahta ile tepsi arası
const SNAP = 60; // doğru yuvaya yapışma eşiği (cömert — küçükler için)
const GLYPH = BOARD * 0.82;

const boardSlot = (id: number) => ({ x: (id % COLS) * TILE, y: Math.floor(id / COLS) * TILE });
const trayCell = (cell: number) => ({
  x: (cell % COLS) * TILE,
  y: BOARD + GAP + Math.floor(cell / COLS) * TILE,
});

/** Harfin tek bir çeyreğini gösteren pencere (aynı büyük harfin kırpılmışı). */
function PieceFace({ char, id, faint }: { char: string; id: number; faint?: boolean }) {
  const col = id % COLS;
  const row = Math.floor(id / COLS);
  return (
    <View
      style={{
        width: TILE,
        height: TILE,
        overflow: "hidden",
        borderRadius: 10,
        backgroundColor: faint ? "transparent" : "#FBF3DE",
        borderWidth: faint ? 0 : 1.5,
        borderColor: "#E8C766",
      }}
    >
      <View
        style={{
          position: "absolute",
          left: -col * TILE,
          top: -row * TILE,
          width: BOARD,
          height: BOARD,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "Amiri_700Bold",
            fontSize: GLYPH,
            lineHeight: BOARD,
            color: faint ? "rgba(42,42,51,0.14)" : "#2A2A33",
          }}
        >
          {char}
        </Text>
      </View>
    </View>
  );
}

function Piece({
  char,
  id,
  start,
  locked,
  onPlaced,
}: {
  char: string;
  id: number;
  start: { x: number; y: number };
  locked: boolean;
  onPlaced: (id: number) => void;
}) {
  const target = boardSlot(id);
  const tx = useSharedValue(start.x);
  const ty = useSharedValue(start.y);
  const baseX = useSharedValue(start.x);
  const baseY = useSharedValue(start.y);
  const drag = useSharedValue(0);

  const place = () => {
    haptics.success();
    playSfx("step_complete");
    onPlaced(id);
  };

  const pan = Gesture.Pan()
    .onBegin(() => {
      drag.value = 1;
    })
    .onUpdate((e) => {
      tx.value = baseX.value + e.translationX;
      ty.value = baseY.value + e.translationY;
    })
    .onEnd(() => {
      drag.value = 0;
      const dx = tx.value - target.x;
      const dy = ty.value - target.y;
      if (Math.sqrt(dx * dx + dy * dy) < SNAP) {
        tx.value = withTiming(target.x, { duration: 140 });
        ty.value = withTiming(target.y, { duration: 140 });
        baseX.value = target.x;
        baseY.value = target.y;
        runOnJS(place)();
      } else {
        tx.value = withSpring(baseX.value);
        ty.value = withSpring(baseY.value);
      }
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: 1 + drag.value * 0.07 }],
    zIndex: drag.value ? 20 : locked ? 5 : 10,
    shadowColor: "#1462B5",
    shadowOpacity: drag.value ? 0.35 : 0.18,
    shadowRadius: drag.value ? 10 : 5,
    shadowOffset: { width: 0, height: drag.value ? 7 : 3 },
  }));

  const body = (
    <Animated.View style={[{ position: "absolute", width: TILE, height: TILE }, style]}>
      <PieceFace char={char} id={id} />
    </Animated.View>
  );

  return locked ? body : <GestureDetector gesture={pan}>{body}</GestureDetector>;
}

export function PuzzleGame({ char, onComplete }: { char: string; onComplete: () => void }) {
  // Karışık tepsi sırası (özdeş çıkarsa kaydır)
  const order = useMemo(() => {
    const a = [0, 1, 2, 3];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    if (a.every((v, i) => v === i)) a.reverse();
    return a;
  }, [char]);

  const [placed, setPlaced] = useState<number[]>([]);
  const handlePlaced = (id: number) => setPlaced((p) => (p.includes(id) ? p : [...p, id]));

  useEffect(() => {
    if (placed.length === ROWS * COLS) {
      const t = setTimeout(onComplete, 450);
      return () => clearTimeout(t);
    }
  }, [placed.length, onComplete]);

  // piece id -> başlangıç tepsi konumu
  const startOf = (id: number) => trayCell(order.indexOf(id));

  return (
    <View style={{ width: BOARD, height: BOARD + GAP + ROWS * TILE }}>
      {/* Tahta: silik harf rehberi + yuva ızgarası */}
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: BOARD,
          height: BOARD,
          borderRadius: 14,
          backgroundColor: "rgba(255,255,255,0.4)",
          borderWidth: 2,
          borderColor: "rgba(255,255,255,0.65)",
          overflow: "hidden",
        }}
      >
        <View style={{ position: "absolute", left: 0, top: 0, width: BOARD, height: BOARD, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontFamily: "Amiri_700Bold", fontSize: GLYPH, lineHeight: BOARD, color: "rgba(42,42,51,0.14)" }}>{char}</Text>
        </View>
        {/* yuva ayraçları */}
        <View style={{ position: "absolute", left: TILE - 1, top: 8, bottom: 8, width: 2, backgroundColor: "rgba(20,98,181,0.08)" }} />
        <View style={{ position: "absolute", top: TILE - 1, left: 8, right: 8, height: 2, backgroundColor: "rgba(20,98,181,0.08)" }} />
      </View>

      {/* Parçalar */}
      {[0, 1, 2, 3].map((id) => (
        <Piece key={id} char={char} id={id} start={startOf(id)} locked={placed.includes(id)} onPlaced={handlePlaced} />
      ))}
    </View>
  );
}
