import { useState } from "react";

const formats = ["jpg", "png", "webp"];
const resolutionOptions = [
  { label: "Original", value: "" },
  { label: "4K (3840x2160)", value: "3840x2160" },
  { label: "1440p (2560x1440)", value: "2560x1440" },
  { label: "1080p (1920x1080)", value: "1920x1080" },
  { label: "720p (1280x720)", value: "1280x720" },
  { label: "Custom", value: "custom" }
];
const qualityOptions = [
  { label: "Auto", value: "" },
  { label: "High (95)", value: "95" },
  { label: "Balanced (85)", value: "85" },
  { label: "Compressed (70)", value: "70" },
  { label: "Custom", value: "custom" }
];

const ImageConversionOptionsPanel = ({ images = [], onConvert }) => {
  const [imageId, setImageId] = useState("");
  const [targetFormat, setTargetFormat] = useState("jpg");
  const [resolutionPreset, setResolutionPreset] = useState("");
  const [resolution, setResolution] = useState("");
  const [qualityPreset, setQualityPreset] = useState("");
  const [quality, setQuality] = useState("");

  const handleSubmit = () => {
    if (!imageId) return;
    const resolvedResolution =
      resolutionPreset === "custom" ? resolution : resolutionPreset;
    const resolvedQuality = qualityPreset === "custom" ? quality : qualityPreset;
    onConvert?.({
      image_id: Number(imageId),
      target_format: targetFormat,
      target_resolution: resolvedResolution || null,
      quality: resolvedQuality ? Number(resolvedQuality) : null
    });
  };

  return (
    <div className="glass-panel rounded-3xl p-8 shadow-lg">
      <h3 className="font-display text-2xl">Image conversion</h3>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold">
          Select image
          <select
            value={imageId}
            onChange={(event) => setImageId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-ink/20 bg-white p-3"
          >
            <option value="">Pick an image</option>
            {images.map((image) => (
              <option key={image.id} value={image.id}>
                {image.original_filename}
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
              placeholder="e.g. 1920x1080"
            />
          )}
        </label>
        <label className="text-sm font-semibold">
          Quality
          <select
            value={qualityPreset}
            onChange={(event) => {
              const next = event.target.value;
              setQualityPreset(next);
              if (next !== "custom") {
                setQuality(next);
              }
            }}
            className="mt-2 w-full rounded-xl border border-ink/20 bg-white p-3"
          >
            {qualityOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {qualityPreset === "custom" && (
            <input
              value={quality}
              onChange={(event) => setQuality(event.target.value)}
              className="mt-2 w-full rounded-xl border border-ink/20 bg-white p-3"
              placeholder="10–95"
            />
          )}
        </label>
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        className="mt-6 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-sand transition hover:bg-ember"
      >
        Convert image
      </button>
    </div>
  );
};

export default ImageConversionOptionsPanel;
