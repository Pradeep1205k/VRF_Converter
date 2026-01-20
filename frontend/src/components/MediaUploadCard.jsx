import { useState } from "react";
import api, { getErrorMessage } from "../services/api";
import ProgressBar from "./ProgressBar";

const MediaUploadCard = ({ onVideoUploaded, onImageUploaded }) => {
  const [files, setFiles] = useState([]);
  const [bulkMode, setBulkMode] = useState(true);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (files.length === 0) return;
    setStatus("uploading");
    setMessage("");
    setProgress(0);

    const uploadQueue = bulkMode ? files : [files[0]];
    let completed = 0;

    for (const file of uploadQueue) {
      const formData = new FormData();
      formData.append("file", file);
      const isImage = file.type.startsWith("image/");
      const endpoint = isImage ? "/image/upload" : "/video/upload";
      try {
        await api.post(endpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (event) => {
            if (event.total) {
              const fileProgress = Math.round((event.loaded / event.total) * 100);
              const overall = Math.round(
                ((completed + fileProgress / 100) / uploadQueue.length) * 100
              );
              setProgress(overall);
            }
          }
        });
        if (isImage) {
          onImageUploaded?.();
        } else {
          onVideoUploaded?.();
        }
        completed += 1;
        setProgress(Math.round((completed / uploadQueue.length) * 100));
      } catch (err) {
        setStatus("error");
        setMessage(getErrorMessage(err, "Upload failed"));
        return;
      }
    }

    setStatus("done");
    setMessage(`Uploaded ${completed} file${completed === 1 ? "" : "s"}.`);
  };

  return (
    <div className="glass-panel rounded-3xl p-8 shadow-lg">
      <h3 className="font-display text-2xl">Upload media</h3>
      <p className="mt-2 text-sm text-ink/70">
        Upload videos and images together. Bulk mode lets you queue multiple files at once.
      </p>
      <div className="mt-6 flex flex-col gap-4">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={bulkMode}
            onChange={(event) => setBulkMode(event.target.checked)}
          />
          Bulk mode (multiple files)
        </label>
        <input
          type="file"
          accept="video/*,image/*"
          multiple={bulkMode}
          onChange={(event) => setFiles(Array.from(event.target.files || []))}
          className="block w-full text-sm"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={files.length === 0 || status === "uploading"}
          className="rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-ink/30"
        >
          {status === "uploading" ? "Uploading..." : "Start upload"}
        </button>
        {status === "uploading" && <ProgressBar progress={progress} />}
        {message && (
          <p className={status === "error" ? "text-sm text-ember" : "text-sm text-moss"}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default MediaUploadCard;
