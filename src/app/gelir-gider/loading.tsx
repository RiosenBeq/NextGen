export default function Loading() {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-[24px] border-4 border-slate-100 shadow-inner"></div>
        <div className="w-16 h-16 rounded-[24px] border-4 border-blue-600 border-t-transparent animate-spin absolute top-0 left-0 shadow-lg shadow-blue-500/10"></div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-black tracking-[0.4em] text-slate-400 uppercase animate-pulse">NextGen Box</span>
        <span className="text-xs font-bold text-slate-300 italic">Yükleniyor...</span>
      </div>
    </div>
  );
}
