export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center">
      
      {/* LOADER ANIMASIYASI */}
      <div className="relative flex items-center justify-center">
        {/* Arxa dairə */}
        <div className="w-20 h-20 border-4 border-gray-100 rounded-full"></div>
        {/* Fırlanan rəngli dairə */}
        <div className="absolute w-20 h-20 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        
        {/* Ortada Logo və ya İkon */}
        <div className="absolute font-black text-gray-700 text-sm tracking-tighter">
            MOC
        </div>
      </div>

      {/* YAZI */}
      <div className="mt-4 text-center">
        <h3 className="text-lg font-bold text-gray-800">Main Olympic Center</h3>
        <p className="text-amber-600 text-sm font-medium animate-pulse">Yüklənir...</p>
      </div>
      
    </div>
  )
}
