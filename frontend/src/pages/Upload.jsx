import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import VideoUploadCard from "../components/VideoUploadCard";
import api from "../services/api";

const Upload = () => {
  const [videos, setVideos] = useState([]);

  const loadVideos = async () => {
    const response = await api.get("/video/list");
    setVideos(response.data || []);
  };

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    if (!videos.some((video) => !video.preview_path)) {
      return undefined;
    }
    const interval = setInterval(loadVideos, 3000);
    return () => clearInterval(interval);
  }, [videos]);

  return (
    <section className="animate-float-in">
      <h1 className="font-display text-4xl">Upload & queue</h1>
      <p className="mt-2 max-w-xl text-sm text-ink/70">
        Add new videos to the platform and instantly start conversion workflows.
      </p>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <VideoUploadCard onUploaded={loadVideos} />
        <div className="glass-panel rounded-3xl p-8 shadow-lg">
          <h3 className="font-display text-2xl">Recent uploads</h3>
          <div className="mt-4 space-y-4">
            {videos.length === 0 ? (
              <p className="text-sm text-ink/60">No uploads yet.</p>
            ) : (
              videos.map((video) => (
                <div key={video.id} className="rounded-2xl border border-ink/10 bg-white/60 p-4">
                  <p className="text-sm font-semibold">{video.original_filename}</p>
                  <p className="text-xs text-ink/60">{video.original_resolution || "unknown resolution"}</p>
                  {video.preview_path ? (
                    <Link
                      to={`/preview/${video.id}`}
                      className="mt-3 inline-flex text-sm font-semibold text-ember"
                    >
                      Preview original
                    </Link>
                  ) : (
                    <span className="mt-3 inline-flex text-xs text-ink/60">
                      Preview rendering...
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Upload;
