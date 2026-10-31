// Shared by the first-paint HTML preload and the React banner; keep URLs identical.
export const infrastructureBannerOriginal = "/images/solutions/panduit-high-density-cinematic.png";
export const infrastructureBanner = {
  src: "/images/solutions/panduit-high-density-cinematic-1672.webp",
  srcSet: "/images/solutions/panduit-high-density-cinematic-960.webp 960w, /images/solutions/panduit-high-density-cinematic-1672.webp 1672w",
  sizes: "100vw",
};
export function bannerImage(image: string) {
  return image === infrastructureBannerOriginal ? infrastructureBanner : { src: image, srcSet: undefined, sizes: undefined };
}
export const homeBannerPreload = `<link rel="preload" as="image" href="${infrastructureBanner.src}" imagesrcset="${infrastructureBanner.srcSet}" imagesizes="100vw" fetchpriority="high">`;
