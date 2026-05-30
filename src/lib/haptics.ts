import * as Haptics from "expo-haptics";

/**
 * Haptik geri bildirim sarmalayıcısı.
 * Trace başarısında nazik bir titreşim; hata durumunda ceza YOK
 * (PROJECT PROFILE §3.A: gentle error tolerance, no penalization).
 */

export const haptics = {
  /** Adım/harf başarıyla tamamlandı */
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  /** Hafif dokunsal onay (buton, doğru stroke) */
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  /** Ödül / kutlama (cami parçası açıldı) */
  celebrate: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
};
