import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS } from "react-native-reanimated";
import Svg, { ClipPath, Defs, Polyline, Rect, Text as SvgText } from "react-native-svg";

import type { LetterStrokes } from "@/data/letterStrokes";
import { haptics } from "@/lib/haptics";
import { playSfx } from "@/lib/sfx";

/**
 * Parmakla harf çizme (trace) — kılavuz üzerinden geçme + kapsama tespiti.
 *
 * Merak uyandırıcı kılavuz: yol boyunca ilerleyen animasyonlu nokta "nereden
 * nasıl çiz"i gösterir; başlangıç noktası nabız atar; çizim canlı mavi dolar;
 * bitince yeşil onay. Gentle, ceza yok (PROJECT PROFILE §3.A).
 */

const GRID = 12;
const SUCCESS_THRESHOLD = 0.7;
const GENERIC_TARGET = 16;
const N = 40; // kılavuz yol örnekleme

type Pt = [number, number];

function cellKey(x: number, y: number, w: number, h: number) {
  const cx = Math.min(GRID - 1, Math.max(0, Math.floor((x / w) * GRID)));
  const cy = Math.min(GRID - 1, Math.max(0, Math.floor((y / h) * GRID)));
  return `${cx}_${cy}`;
}

/** Polyline'ı yay-uzunluğuna göre N eşit noktaya örnekle (akıcı animasyon için). */
function resample(pts: Pt[], n: number): Pt[] {
  if (pts.length < 2) return pts;
  const seg: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    seg.push(d);
    total += d;
  }
  const out: Pt[] = [];
  for (let k = 0; k < n; k++) {
    const target = (k / (n - 1)) * total;
    let acc = 0;
    let i = 0;
    while (i < seg.length && acc + seg[i] < target) {
      acc += seg[i];
      i++;
    }
    if (i >= seg.length) {
      out.push(pts[pts.length - 1]);
      continue;
    }
    const f = seg[i] > 0 ? (target - acc) / seg[i] : 0;
    out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f]);
  }
  return out;
}

export function TraceCanvas({
  letterChar,
  strokes,
  onComplete,
  onProgress,
  bare = false,
  showDemo = false,
  demoRTL = false,
  resetSignal = 0,
}: {
  letterChar: string;
  strokes: LetterStrokes | null;
  onComplete: () => void;
  onProgress?: (p: number) => void;
  /** true: kendi çerçevesi/ilerleme çubuğu olmadan (dış panelin içinde kullanım) */
  bare?: boolean;
  /** true: "nasıl çizilir" demo animasyonu (yalnız ilk harflerde) */
  showDemo?: boolean;
  /** true: demo sağdan sola açığa çıkar (Arapça yön); false: yukarıdan aşağı (Elif) */
  demoRTL?: boolean;
  /** dışarıdan sıfırlama tetikleyicisi (değiştikçe çizim temizlenir) */
  resetSignal?: number;
}) {
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [drawn, setDrawn] = useState<Pt[][]>([]);
  const [current, setCurrent] = useState<Pt[]>([]);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const visited = useRef<Set<string>>(new Set());
  const doneRef = useRef(false);
  const sizeRef = useRef(size);
  sizeRef.current = size;

  // Kılavuz hedef hücreleri (kapsama bunlara göre)
  const targetCells = useMemo(() => {
    if (!strokes || size.w === 0) return null;
    const set = new Set<string>();
    for (const stroke of strokes) {
      for (let i = 0; i < stroke.length - 1; i++) {
        const [ax, ay] = stroke[i];
        const [bx, by] = stroke[i + 1];
        for (let s = 0; s <= 24; s++) {
          const t = s / 24;
          set.add(cellKey((ax + (bx - ax) * t) * size.w, (ay + (by - ay) * t) * size.h, size.w, size.h));
        }
      }
    }
    return set;
  }, [strokes, size.w, size.h]);
  const targetRef = useRef(targetCells);
  targetRef.current = targetCells;

  // "Nasıl çizilir" demo — gerçek harf yukarıdan aşağı BOYANIR (yalnız showDemo'da)
  const [revealFrac, setRevealFrac] = useState(0);
  const startedRef = useRef(false);
  startedRef.current = drawn.length > 0 || current.length > 0;
  useEffect(() => {
    if (!showDemo || size.w === 0 || done) {
      setRevealFrac(0);
      return;
    }
    let raf = 0;
    let t0 = 0;
    const DRAW = 1600;
    const HOLD = 800;
    const REST = 600;
    const TOTAL = DRAW + HOLD + REST;
    const tick = (ts: number) => {
      if (startedRef.current) {
        setRevealFrac(0);
      } else {
        if (!t0) t0 = ts;
        const t = (ts - t0) % TOTAL;
        setRevealFrac(t < DRAW ? t / DRAW : t < DRAW + HOLD ? 1 : 0);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [showDemo, size.w, size.h, done]);

  const recompute = useCallback(() => {
    const tgt = targetRef.current;
    let p: number;
    if (tgt && tgt.size > 0) {
      let covered = 0;
      for (const c of visited.current) if (tgt.has(c)) covered++;
      p = covered / tgt.size;
    } else {
      p = Math.min(1, visited.current.size / GENERIC_TARGET);
    }
    setProgress(p);
    onProgressRef.current?.(p);
    if (!doneRef.current && p >= SUCCESS_THRESHOLD) {
      doneRef.current = true;
      setDone(true);
      haptics.success();
      playSfx("trace_success");
      onComplete();
    }
  }, [onComplete]);

  const mark = useCallback(
    (x: number, y: number) => {
      const { w, h } = sizeRef.current;
      if (w === 0) return;
      visited.current.add(cellKey(x, y, w, h));
      recompute();
    },
    [recompute]
  );

  const start = useCallback((x: number, y: number) => {
    haptics.tap();
    playSfx("trace_start", 0.6);
    setCurrent([[x, y]]);
  }, []);
  const move = useCallback((x: number, y: number) => {
    setCurrent((prev) => {
      const last = prev[prev.length - 1];
      if (last && Math.hypot(x - last[0], y - last[1]) < 2.5) return prev;
      return [...prev, [x, y]];
    });
  }, []);
  const end = useCallback(() => {
    setCurrent((c) => {
      if (c.length > 1) setDrawn((d) => [...d, c]);
      return [];
    });
  }, []);
  const reset = useCallback(() => {
    visited.current = new Set();
    doneRef.current = false;
    setDone(false);
    setDrawn([]);
    setCurrent([]);
    setProgress(0);
  }, []);

  // Dışarıdan "Yeniden çiz" tetiklenince temizle
  useEffect(() => {
    if (resetSignal > 0) reset();
  }, [resetSignal, reset]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((e) => {
          runOnJS(start)(e.x, e.y);
          runOnJS(mark)(e.x, e.y);
        })
        .onUpdate((e) => {
          runOnJS(move)(e.x, e.y);
          runOnJS(mark)(e.x, e.y);
        })
        .onEnd(() => runOnJS(end)()),
    [start, move, mark, end]
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  const toPoints = (s: Pt[]) => s.map(([x, y]) => `${x},${y}`).join(" ");
  const toPx = (s: Pt[]) => s.map(([x, y]) => [x * size.w, y * size.h] as Pt);

  return (
    <View style={{ width: "100%", gap: 8, flex: bare ? 1 : undefined }}>
      {/* İlerleme çubuğu (bare modunda dışarıda gösterilir) */}
      {!bare && (
        <View className="h-3.5 overflow-hidden rounded-full bg-white/70">
          <Animated.View
            className="h-full rounded-full"
            style={{ width: `${Math.round(progress * 100)}%`, backgroundColor: done ? "#3FB984" : "#37ACFF" }}
          />
        </View>
      )}

      <GestureDetector gesture={pan}>
        <View
          onLayout={onLayout}
          className={bare ? "overflow-hidden" : "overflow-hidden rounded-3xl border-2 border-white bg-white/55"}
          style={{ height: bare ? undefined : 260, flex: bare ? 1 : undefined }}
        >
          {size.w > 0 && (
            <>
              {/* Kılavuz harf — RN Text ile flex-ortalı (tüm harflerde GARANTİ ortalı).
                  Beyaz gölge → hafif "carved" his. */}
              <View
                pointerEvents="none"
                style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}
              >
                <Text
                  style={{
                    fontFamily: "Amiri_700Bold",
                    fontSize: Math.min(size.w, size.h) * 0.78,
                    color: done ? "#9FCFB6" : "#A6BBD2",
                    textShadowColor: "rgba(255,255,255,0.9)",
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 3,
                    includeFontPadding: false,
                  }}
                >
                  {letterChar}
                </Text>
              </View>

              <Svg width={size.w} height={size.h}>
              {/* "Nasıl çizilir" demo — gerçek harf KESİK KESİK, yönlü açığa çıkar */}
              {showDemo && revealFrac > 0 && (
                <>
                  <Defs>
                    <ClipPath id="trace-reveal">
                      {demoRTL ? (
                        <Rect
                          x={size.w * (1 - revealFrac)}
                          y={0}
                          width={size.w * revealFrac}
                          height={size.h}
                        />
                      ) : (
                        <Rect x={0} y={0} width={size.w} height={size.h * revealFrac} />
                      )}
                    </ClipPath>
                  </Defs>
                  <SvgText
                    x={size.w / 2}
                    y={size.h / 2}
                    fontSize={Math.min(size.w, size.h) * 0.78}
                    fontFamily="Amiri_700Bold"
                    fill="none"
                    stroke="#F5A524"
                    strokeWidth={5}
                    strokeDasharray="11 9"
                    strokeLinecap="round"
                    textAnchor="middle"
                    alignmentBaseline="central"
                    clipPath="url(#trace-reveal)"
                  >
                    {letterChar}
                  </SvgText>
                </>
              )}

              {/* Kullanıcı çizimi (canlı) */}
              {[...drawn, current].map((s, i) =>
                s.length > 1 ? (
                  <Polyline
                    key={`d${i}`}
                    points={toPoints(s)}
                    stroke={done ? "#3FB984" : "#208AEF"}
                    strokeWidth={12}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                ) : null
              )}
              </Svg>
            </>
          )}

        </View>
      </GestureDetector>
    </View>
  );
}
