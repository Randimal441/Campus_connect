export default function Loader() {
  return (
    <div className="loader-container">
      <div className="relative">
        <div className="loader" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-primary font-bold text-sm animate-pulse">CC</span>
        </div>
      </div>
      <p className="font-semibold">Loading your campus experience...</p>
    </div>
  );
}
