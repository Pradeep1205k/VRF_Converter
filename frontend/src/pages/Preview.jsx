import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import DownloadButton from "../components/DownloadButton";
import VideoPreviewPlayer from "../components/VideoPreviewPlayer";
import api, { getErrorMessage } from "../services/api";

const Preview = () => {
  const { videoId } = useParams();
  const { search } = useLocation();
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const conversionId = query.get("conversion_id");
  const kind = query.get("kind") || "original";
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
  const token = localStorage.getItem("vm_access_token");
  const [isReady, setIsReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Preparing preview...");
  const previewParams = new URLSearchParams();
  previewParams.set("kind", kind);
  if (conversionId) previewParams.set("conversion_id", conversionId);
  if (token) previewParams.set("token", token);
  const previewQuery = previewParams.toString();
  const previewUrl = `${apiBase}/video/preview/${videoId}${
    previewQuery ? `?${previewQuery}` : ""
  }`;

  const downloadParams = new URLSearchParams();
  if (conversionId) downloadParams.set("conversion_id", conversionId);
  if (token) downloadParams.set("token", token);
  const downloadQuery = downloadParams.toString();
  const downloadUrl = `${apiBase}/video/download/${videoId}${
    downloadQuery ? `?${downloadQuery}` : ""
  }`;

  useEffect(() => {
    let intervalId;
    let mounted = true;

    const checkStatus = async () => {
      try {
        if (kind === "converted") {
          if (!conversionId) {
            setStatusMessage("Conversion id is missing.");
            setIsReady(false);
            return;
          }
          const response = await api.get(`/video/status/${conversionId}`);
          if (!mounted) return;
          if (response.data.status === "completed") {
            setIsReady(true);
            setStatusMessage("Ready.");
            return;
          }
          if (response.data.status === "failed") {
            setIsReady(false);
            setStatusMessage(response.data.error_message || "Conversion failed.");
            return;
          }
          setIsReady(false);
          setStatusMessage("Conversion is still processing...");
          return;
        }

        const response = await api.get("/video/list");
        if (!mounted) return;
        const video = response.data?.find((item) => String(item.id) === String(videoId));
        if (video?.preview_path) {
          setIsReady(true);
          setStatusMessage("Ready.");
        } else {
          setIsReady(false);
          setStatusMessage("Preview clip is still rendering...");
        }
      } catch (err) {
        if (!mounted) return;
        setIsReady(false);
        setStatusMessage(getErrorMessage(err, "Unable to load preview."));
      }
    };

    checkStatus();
    intervalId = setInterval(checkStatus, 3000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [conversionId, kind, videoId]);

  return (
    <section className="animate-float-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-4xl">Preview</h1>
          <p className="mt-2 text-sm text-ink/70">
            {kind === "converted" ? "Converted output" : "Original preview clip"}
          </p>
          {!isReady && <p className="mt-2 text-xs text-ink/60">{statusMessage}</p>}
        </div>
        <div className="flex gap-3">
          {isReady && <DownloadButton href={downloadUrl} label="Download file" />}
          <Link
            to="/history"
            className="inline-flex items-center rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold"
          >
            Back to history
          </Link>
        </div>
      </div>
      <div className="mt-8">
        {isReady ? (
          <VideoPreviewPlayer src={previewUrl} />
        ) : (
          <div className="rounded-3xl border border-ink/10 bg-white/70 p-8 text-sm text-ink/70">
            Preview will appear here once it is ready.
          </div>
        )}
      </div>
    </section>
  );
};

export default Preview;
