import { HudhudMascot } from "./HudhudMascot";

/**
 * Maskot "Pırıl" (Hüdhüd) — 2D kod puppet (HudhudMascot). Tüm ekranlar bunu kullanır.
 * (3D denendi, iptal edildi — bkz HudhudMascot.)
 */
export type MascotPose = "idle" | "happy" | "celebrate" | "wave" | "point";

export function Mascot(props: { size?: number; onTap?: () => void; pose?: MascotPose; talking?: boolean }) {
  return <HudhudMascot {...props} />;
}
