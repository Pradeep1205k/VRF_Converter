const VideoPreviewPlayer = ({ src }) => (
  <div className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-lg">
    <video className="w-full" controls playsInline preload="metadata" src={src} />
  </div>
);

export default VideoPreviewPlayer;
