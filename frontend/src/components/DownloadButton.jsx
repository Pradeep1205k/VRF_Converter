const DownloadButton = ({ href, label = "Download" }) => (
  <a
    href={href}
    className="inline-flex items-center justify-center rounded-full bg-ember px-4 py-2 text-sm font-semibold text-white hover:bg-ink"
  >
    {label}
  </a>
);

export default DownloadButton;
