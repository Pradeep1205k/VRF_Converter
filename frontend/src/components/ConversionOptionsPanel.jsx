import { useState } from "react";

const formats = ["mp4", "mkv", "webm", "avi", "mov"];
const resolutionOptions = [
  { label: "Original", value: "" },
  { label: "8K (7680x4320)", value: "7680x4320" },
  { label: "4K (3840x2160)", value: "3840x2160" },
  { label: "1440p (2560x1440)", value: "2560x1440" },
  { label: "1080p (1920x1080)", value: "1920x1080" },
  { label: "720p (1280x720)", value: "1280x720" },
  { label: "480p (854x480)", value: "854x480" },
  { label: "360p (640x360)", value: "640x360" },
  { label: "Custom", value: "custom" }
];
const bitrateOptions = [
  { label: "Auto", value: "" },
  { label: "800 kbps", value: "800k" },
  { label: "1500 kbps", value: "1500k" },
  { label: "2500 kbps", value: "2500k" },
  { label: "4000 kbps", value: "4000k" },
  { label: "8000 kbps", value: "8000k" },
  { label: "Custom", value: "custom" }
];
const fpsOptions = [
  { label: "Auto", value: "" },
  { label: "24 fps", value: "24" },
  { label: "30 fps", value: "30" },
  { label: "60 fps", value: "60" },
  { label: "Custom", value: "custom" }
];
const codecOptions = [
  { label: "Auto", value: "" },
  { label: "H.264 (libx264)", value: "libx264" },
  { label: "H.265 (libx265)", value: "libx265" },
  { label: "VP9 (libvpx-vp9)", value: "libvpx-vp9" },
  { label: "AV1 (libaom-av1)", value: "libaom-av1" },
  { label: "Custom", value: "custom" }
];

const ConversionOptionsPanel = ({ videos = [], onConvert }) => {
  const [videoId, setVideoId] = useState("");
  const [targetFormat, setTargetFormat] = useState("mp4");
  const [resolutionPreset, setResolutionPreset] = useState("");
  const [resolution, setResolution] = useState("");
  const [bitratePreset, setBitratePreset] = useState("");
  const [bitrate, setBitrate] = useState("");
  const [fpsPreset, setFpsPreset] = useState("");
  const [fps, setFps] = useState("");
  const [codecPreset, setCodecPreset] = useState("");
  const [codec, setCodec] = useState("");
  const [keepAudio, setKeepAudio] = useState(true);
  const [cleanMetadata, setCleanMetadata] = useState(false);

  const handleSubmit = () => {
    if (!videoId) return;
    const resolvedResolution =
      resolutionPreset === "custom" ? resolution : resolutionPreset;
    const resolvedBitrate = bitratePreset === "custom" ? bitrate : bitratePreset;
    const resolvedFps = fpsPreset === "custom" ? fps : fpsPreset;
    const resolvedCodec = codecPreset === "custom" ? codec : codecPreset;
    onConvert?.({
      video_id: Number(videoId),
      target_format: targetFormat,
      target_resolution: resolvedResolution || null,
      target_bitrate: resolvedBitrate || null,
      target_fps: resolvedFps || null,
      target_codec: resolvedCodec || null,
      keep_audio: keepAudio,
      clean_metadata: cleanMetadata
    });
  };

  return (
    <div className="glass-panel rounded-3xl p-8 shadow-lg">
      <h3 className="font-display text-2xl">Conversion settings</h3>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold">
          Select video
          <select
            value={videoId}
            onChange={(event) => setVideoId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-ink/20 bg-white p-3"
          >
            <option value="">Pick a video</option>
            {videos.map((video) => (
              <option key={video.id} value={video.id}>
                {video.original_filename}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Target format
          <select
            value={targetFormat}
            onChange={(event) => setTargetFormat(event.target.value)}
            className="mt-2 w-full rounded-xl border border-ink/20 bg-white p-3"
          >
            {formats.map((format) => (
              <option key={format} value={format}>
                {format.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Resolution
          <select
            value={resolutionPreset}
            onChange={(event) => {
              const next = event.target.value;
              setResolutionPreset(next);
              if (next !== "custom") {
                setResolution(next);
              }
            }}
            className="mt-2 w-full rounded-xl border border-ink/20 bg-white p-3"
          >
            {resolutionOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {resolutionPreset === "custom" && (
            <input
              value={resolution}
              onChange={(event) => setResolution(event.target.value)}
              className="mt-2 w-full rounded-xl border border-ink/20 bg-white p-3"
              placeholder="e.g. 1280x720"
            />
          )}
        </label>
        <label className="text-sm font-semibold">
          Bitrate
          <select
            value={bitratePreset}
            onChange={(event) => {
              const next = event.target.value;
              setBitratePreset(next);
              if (next !== "custom") {
                setBitrate(next);
              }
            }}
            className="mt-2 w-full rounded-xl border border-ink/20 bg-white p-3"
          >
            {bitrateOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {bitratePreset === "custom" && (
            <input
              value={bitrate}
              onChange={(event) => setBitrate(event.target.value)}
              className="mt-2 w-full rounded-xl border border-ink/20 bg-white p-3"
              placeholder="e.g. 3500k"
            />
          )}
        </label>
        <label className="text-sm font-semibold">
          FPS
          <select
            value={fpsPreset}
            onChange={(event) => {
              const next = event.target.value;
              setFpsPreset(next);
              if (next !== "custom") {
                setFps(next);
              }
            }}
            className="mt-2 w-full rounded-xl border border-ink/20 bg-white p-3"
          >
            {fpsOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fpsPreset === "custom" && (
            <input
              value={fps}
              onChange={(event) => setFps(event.target.value)}
              className="mt-2 w-full rounded-xl border border-ink/20 bg-white p-3"
              placeholder="e.g. 30"
            />
          )}
        </label>
        <label className="text-sm font-semibold">
          Codec
          <select
            value={codecPreset}
            onChange={(event) => {
              const next = event.target.value;
              setCodecPreset(next);
              if (next !== "custom") {
                setCodec(next);
              }
            }}
            className="mt-2 w-full rounded-xl border border-ink/20 bg-white p-3"
          >
            {codecOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {codecPreset === "custom" && (
            <input
              value={codec}
              onChange={(event) => setCodec(event.target.value)}
              className="mt-2 w-full rounded-xl border border-ink/20 bg-white p-3"
              placeholder="e.g. libx264"
            />
          )}
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={keepAudio}
            onChange={(event) => setKeepAudio(event.target.checked)}
          />
          Keep audio
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={cleanMetadata}
            onChange={(event) => setCleanMetadata(event.target.checked)}
          />
          Clean metadata
        </label>
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        className="mt-6 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-sand transition hover:bg-ember"
      >
        Start conversion
      </button>
    </div>
  );
};

export default ConversionOptionsPanel;
