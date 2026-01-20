import { useState } from "react";
import api, { getErrorMessage } from "../services/api";
import ProgressBar from "./ProgressBar";

const VideoUploadCard = ({ onUploaded }) => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await api.post("/video/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (event.total) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setProgress(percent);
          }
        }
      });
      setStatus("done");
      setProgress(100);
      onUploaded?.(response.data);
    } catch (err) {
      setStatus("error");
      setError(getErrorMessage(err, "Upload failed"));
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-8 shadow-lg">
      <h3 className="font-display text-2xl">Upload a video</h3>
      <p className="mt-2 text-sm text-ink/70">
        Accepts mp4, mkv, webm, avi, mov. Size limit is controlled by backend settings.
      </p>
      <div className="mt-6 flex flex-col gap-4">
        <input
          type="file"
          accept="video/*"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          className="block w-full text-sm"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || status === "uploading"}
          className="rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-ink/30"
        >
          {status === "uploading" ? "Uploading..." : "Start upload"}
        </button>
        {status === "uploading" && <ProgressBar progress={progress} />}
        {status === "done" && <p className="text-sm text-moss">Upload complete.</p>}
        {status === "error" && <p className="text-sm text-ember">{error}</p>}
      </div>
    </div>
  );
};

export default VideoUploadCard;
