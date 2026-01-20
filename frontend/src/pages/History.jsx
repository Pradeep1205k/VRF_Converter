import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";
import api from "../services/api";

const History = () => {
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    const response = await api.get("/video/history");
    setHistory(response.data || []);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    const hasProcessing = history.some((item) =>
      ["queued", "processing"].includes(item.conversion.status)
    );
    if (!hasProcessing) return undefined;
    const interval = setInterval(loadHistory, 4000);
    return () => clearInterval(interval);
  }, [history]);

  const token = localStorage.getItem("vm_access_token");

  return (
    <section className="animate-float-in">
      <h1 className="font-display text-4xl">Conversion history</h1>
      <p className="mt-2 max-w-xl text-sm text-ink/70">
        Access every conversion, grab downloads, and revisit previews.
      </p>
      <div className="mt-10 space-y-4">
        {history.length === 0 ? (
          <p className="text-sm text-ink/60">No conversions yet.</p>
        ) : (
          history.map((item) => (
            <div key={item.conversion.id} className="glass-panel rounded-3xl p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold">{item.video.original_filename}</p>
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
                  to={`/preview/${item.video.id}?conversion_id=${item.conversion.id}&kind=converted`}
                  className="inline-flex rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold"
                >
                  Preview
                </Link>
                {item.conversion.status === "completed" && (
                  <a
                    href={`${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/video/download/${
                      item.video.id
                    }?${new URLSearchParams({
                      conversion_id: String(item.conversion.id),
                      ...(token ? { token } : {})
                    }).toString()}`}
                    className="inline-flex rounded-full bg-ember px-4 py-2 text-xs font-semibold text-white"
                  >
                    Download
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default History;
