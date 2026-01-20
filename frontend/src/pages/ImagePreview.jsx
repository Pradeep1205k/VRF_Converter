import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import DownloadButton from "../components/DownloadButton";

const ImagePreview = () => {
  const { imageId } = useParams();
  const { search } = useLocation();
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const conversionId = query.get("conversion_id");
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
  const token = localStorage.getItem("vm_access_token");

  const previewParams = new URLSearchParams();
  if (conversionId) previewParams.set("conversion_id", conversionId);
  if (token) previewParams.set("token", token);
  const previewQuery = previewParams.toString();
  const previewUrl = `${apiBase}/image/preview/${imageId}${
    previewQuery ? `?${previewQuery}` : ""
  }`;

  const downloadUrl = `${apiBase}/image/download/${imageId}${
    previewQuery ? `?${previewQuery}` : ""
  }`;

  return (
    <section className="animate-float-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-4xl">Image preview</h1>
          <p className="mt-2 text-sm text-ink/70">Preview the original or converted image.</p>
        </div>
        <div className="flex gap-3">
          <DownloadButton href={downloadUrl} label="Download" />
          <Link
            to="/images"
            className="inline-flex items-center rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold"
          >
            Back to images
          </Link>
        </div>
      </div>
      <div className="mt-8 overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-lg">
        <img src={previewUrl} alt="Preview" className="w-full object-contain" />
      </div>
    </section>
  );
};

export default ImagePreview;
