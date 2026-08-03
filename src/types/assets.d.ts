/**
 * Font/varlık dosyalarını doğrudan import edebilmek için.
 *
 * Font'lar paketin kökünden değil ALT YOLDAN alınıyor — kökten import edilince
 * Metro ailenin bütün ağırlıklarını pakete koyuyordu (25 dosya, ~4 MB), oysa
 * yalnız dördü kullanılıyor.
 */
declare module "*.ttf" {
  const asset: number;
  export default asset;
}
declare module "*.otf" {
  const asset: number;
  export default asset;
}
