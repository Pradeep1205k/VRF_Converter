import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import ConversionOptionsPanel from "../components/ConversionOptionsPanel";
import MediaUploadCard from "../components/MediaUploadCard";
import ProgressBar from "../components/ProgressBar";

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [videos, setVideos] = useState([]);
  const [activeConversion, setActiveConversion] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  const loadHistory = async () => {
    const [historyResponse, videosResponse] = await Promise.all([
      api.get("/video/history"),
      api.get("/video/list")
    ]);
    setHistory(historyResponse.data || []);
    setVideos(videosResponse.data || []);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (!activeConversion) return;
    const interval = setInterval(async () => {
      const response = await api.get(`/video/status/${activeConversion.id}`);
      setActiveConversion(response.data);
      if (response.data.status === "completed" || response.data.status === "failed") {
        clearInterval(interval);
        loadHistory();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [activeConversion]);

  const handleConvert = async (payload) => {
    setStatusMessage("");
    try {
      const response = await api.post("/video/convert", payload);
      setActiveConversion(response.data);
      setStatusMessage("Conversion started. Track progress below.");
    } catch (err) {
      setStatusMessage(err.response?.data?.detail || "Failed to start conversion");
    }
  };

  const stats = useMemo(() => {
    const conversions = history.length;
    const uniqueVideos = new Set(history.map((item) => item.video.id)).size;
    return { conversions, uniqueVideos };
  }, [history]);

  return (
    <section className="animate-float-in">
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-4xl">Control room</h1>
          <p className="mt-2 max-w-xl text-sm text-ink/70">
            Orchestrate conversions, track progress, and keep your library ready for any device.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="rounded-2xl border border-ink/10 bg-white/70 px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-ink/60">Videos</p>
            <p className="font-display text-2xl">{stats.uniqueVideos}</p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white/70 px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-ink/60">Conversions</p>
            <p className="font-display text-2xl">{stats.conversions}</p>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <MediaUploadCard onVideoUploaded={loadHistory} />
          <ConversionOptionsPanel videos={videos} onConvert={handleConvert} />
        </div>
        <div className="glass-panel rounded-3xl p-8 shadow-lg">
          <h3 className="font-display text-2xl">Active conversion</h3>
          {statusMessage && <p className="mt-2 text-sm text-ink/70">{statusMessage}</p>}
          {activeConversion ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm font-semibold text-ink/80">{activeConversion.status}</p>
              <ProgressBar progress={activeConversion.progress} />
              {activeConversion.status === "completed" && (
                <Link
                  to={`/preview/${activeConversion.video_id}?conversion_id=${activeConversion.id}&kind=converted`}
                  className="inline-flex items-center justify-center rounded-full bg-ember px-4 py-2 text-sm font-semibold text-white"
                >
                  Preview conversion
                </Link>
              )}
            </div>
          ) : (
            <p className="mt-6 text-sm text-ink/60">No active conversions yet.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
