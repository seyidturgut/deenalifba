// NativeWind / Metro: CSS yan-etki importları ve CSS modülleri için tip bildirimi.
declare module "*.css";
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
