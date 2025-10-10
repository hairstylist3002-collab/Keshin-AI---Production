export default function AuthCallback() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 border-4 border-neutral-800 border-t-fuchsia-500 rounded-full animate-spin mb-4"></div>
        <p className="text-neutral-400">Finalizing session, please wait...</p>
      </div>
    </div>
  );
}
