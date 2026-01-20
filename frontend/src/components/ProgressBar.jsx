const ProgressBar = ({ progress }) => (
  <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
    <div
      className="h-full rounded-full bg-moss transition-all"
      style={{ width: `${progress}%` }}
    />
  </div>
);

export default ProgressBar;
