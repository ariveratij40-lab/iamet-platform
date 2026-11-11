import { brandVisuals } from "./brandVisuals";

export default function BrandLogoV2({ slug, name }: { slug: string; name: string }) {
  const visual = brandVisuals[slug];
  if (!visual) return null;
  return (
    <div className="mb-5 flex h-[100px] w-full max-w-[260px] items-center justify-center overflow-hidden rounded-xl p-3" style={{ background: "#ffffff" }}>
      <img src={visual.logo} alt={name} loading="lazy" decoding="async"
        className="h-full w-full object-contain"
        style={{ transform: visual.padded ? "scale(2.2)" : undefined }} />
    </div>
  );
}
