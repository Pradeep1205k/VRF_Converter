import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ImageConversionOptionsPanel from "../components/ImageConversionOptionsPanel";
import ProgressBar from "../components/ProgressBar";
import api, { getErrorMessage } from "../services/api";

const Images = () => {
  const [history, setHistory] = useState([]);
  const [images, setImages] = useState([]);
  const [activeConversion, setActiveConversion] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  const loadData = async () => {
    const [historyResponse, imagesResponse] = await Promise.all([
      api.get("/image/history"),
      api.get("/image/list")
    ]);
    setHistory(historyResponse.data || []);
    setImages(imagesResponse.data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!activeConversion) return;
    const interval = setInterval(async () => {
      const response = await api.get(`/image/status/${activeConversion.id}`);
      setActiveConversion(response.data);
      if (response.data.status === "completed" || response.data.status === "failed") {
        clearInterval(interval);
        loadData();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [activeConversion]);

  const handleConvert = async (payload) => {
    setStatusMessage("");
    try {
      const response = await api.post("/image/convert", payload);
      setActiveConversion(response.data);
      setStatusMessage("Conversion started.");
    } catch (err) {
      setStatusMessage(getErrorMessage(err, "Failed to start conversion"));
    }
  };

  return (
    <section className="animate-float-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-4xl">Image lab</h1>
          <p className="mt-2 max-w-xl text-sm text-ink/70">
            Convert image formats, resize assets, and download ready-to-use files.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold"
        >
          Back to video
        </Link>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <ImageConversionOptionsPanel images={images} onConvert={handleConvert} />
        <div className="glass-panel rounded-3xl p-8 shadow-lg">
          <h3 className="font-display text-2xl">Active conversion</h3>
          {statusMessage && <p className="mt-2 text-sm text-ink/70">{statusMessage}</p>}
          {activeConversion ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm font-semibold text-ink/80">{activeConversion.status}</p>
              <ProgressBar progress={activeConversion.progress} />
              {activeConversion.status === "completed" && (
                <Link
                  to={`/image-preview/${activeConversion.image_id}?conversion_id=${activeConversion.id}`}
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

      <div className="mt-10 space-y-4">
        <h3 className="font-display text-2xl">Recent image conversions</h3>
        {history.length === 0 ? (
          <p className="text-sm text-ink/60">No conversions yet.</p>
        ) : (
          history.map((item) => (
            <div key={item.conversion.id} className="glass-panel rounded-3xl p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold">{item.image.original_filename}</p>
                  <p className="text-xs text-ink/60">
                    {item.conversion.target_format.toUpperCase()} | {item.conversion.target_resolution || "original"}
                  </p>
                </div>
                <p className="text-xs uppercase tracking-wide text-ink/60">
                  {item.conversion.status}
                </p>
              </div>
              <div className="mt-4">
                <ProgressBar progress={item.conversion.progress} />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to={`/image-preview/${item.image.id}?conversion_id=${item.conversion.id}`}
                  className="inline-flex rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold"
                >
                  Preview
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default Images;
