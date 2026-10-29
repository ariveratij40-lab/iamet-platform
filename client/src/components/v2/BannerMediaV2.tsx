import { useEffect, useRef, useState } from "react";

type Props = {
  image: string;
  video?: string;
  paused: boolean;
  reduceMotion: boolean;
};

/** Only the active slide mounts media. Poster stays visible until playback is ready. */
export default function BannerMediaV2({
  image,
  video,
  paused,
  reduceMotion,
}: Props) {
  const player = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const hasVideo = Boolean(video) && !reduceMotion && !failed;

  useEffect(() => {
    const target = root.current;
    if (!target) return;
    let inView = true;
    const update = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    observer.observe(target);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  useEffect(() => {
    const element = player.current;
    if (!element || !hasVideo) return;
    if (paused || !visible) {
      element.pause();
      return;
    }
    let cancelled = false;
    element.play().catch(error => {
      // A rapid slide change or pause can abort a pending play without media failure.
      if (!cancelled && error.name !== "AbortError") setFailed(true);
    });
    return () => {
      cancelled = true;
      element.pause();
    };
  }, [hasVideo, paused, visible, video]);

  const imageClass =
    "absolute inset-0 h-full w-full object-cover object-[72%_center] lg:object-[62%_center]";
  return (
    <div ref={root} className="absolute inset-0" aria-hidden="true">
      <img
        src={image}
        alt=""
        className={`${imageClass} ${!reduceMotion && !hasVideo ? "iamet-cctv-cinematic" : ""}`}
        style={{
          animationPlayState: paused || !visible ? "paused" : "running",
        }}
      />
      {hasVideo && (
        <video
          ref={player}
          src={video}
          poster={image}
          muted
          playsInline
          loop
          preload="metadata"
          onLoadedData={() => setReady(true)}
          onError={() => setFailed(true)}
          className={`${imageClass} transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}
