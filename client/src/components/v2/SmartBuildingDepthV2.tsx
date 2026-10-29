type Props = { image: string; paused: boolean };

/** Lightweight regional depth planes; no video generation or external 3D runtime. */
export default function SmartBuildingDepthV2({ image, paused }: Props) {
  return (
    <div
      className="iamet-depth-scene absolute inset-0 overflow-hidden"
      data-paused={paused}
      aria-hidden="true"
    >
      <div className="iamet-depth-camera absolute inset-0">
        <img
          src={image}
          alt=""
          className="iamet-depth-image iamet-depth-base"
        />
        <div className="iamet-depth-upper absolute inset-0">
          <img src={image} alt="" className="iamet-depth-image" />
        </div>
        <div className="iamet-depth-front absolute inset-0">
          <img src={image} alt="" className="iamet-depth-image" />
        </div>
        <div className="iamet-depth-light absolute inset-0" />
      </div>
      <div className="iamet-depth-lens absolute inset-0" />
    </div>
  );
}
