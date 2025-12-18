import React from 'react';
import { CheckCircle, Calendar, FileText, User, Download } from 'lucide-react';

interface ResultProps {
  studentName: string;
  studentId: string;
  quizName: string;
  score: number;
  total: number;
  percent: number;
  date: string;
  logoUrl?: string;
}

export default function ResultCard({
  studentName,
  studentId,
  quizName,
  score,
  total,
  percent,
  date,
  logoUrl
}: ResultProps) {
  const isPass = percent >= 50;
  const statusColor = isPass ? "text-green-600" : "text-red-600";
  const statusBg = isPass ? "bg-green-50" : "bg-red-50";
  const borderColor = isPass ? "border-green-200" : "border-red-200";

  return (
    <div className="animate-fade-in-up w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
      <div className="bg-blue-600 p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 opacity-30 pattern-grid-lg"></div>
        <div className="relative z-10 flex flex-col items-center">
          {logoUrl && (
            <div className="bg-white p-3 rounded-2xl shadow-lg mb-4 h-24 w-24 flex items-center justify-center transform hover:scale-105 transition duration-300">
              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
            </div>
          )}
          <h2 className="text-2xl font-bold text-white tracking-wide">Main Olympic Center</h2>
        </div>
      </div>

      <div className="px-8 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{studentName}</h1>
          <div className="inline-flex items-center gap-2 text-gray-500 bg-gray-100 px-4 py-1.5 rounded-full text-sm font-medium">
            <User size={16} />
            <span>ID: {studentId}</span>
          </div>
        </div>

        <div className={`flex flex-col items-center justify-center p-8 rounded-3xl ${statusBg} mb-8 border-2 border-dashed ${borderColor}`}>
          <span className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Nəticə</span>
          <div className={`text-7xl font-black ${statusColor} tracking-tighter`}>
            {percent}<span className="text-4xl align-top">%</span>
          </div>
          <p className="text-gray-600 font-medium mt-3 text-sm">
            {isPass ? "🎉 Əla nəticə, təbrik edirik!" : "📚 Daha çox çalışmalısan."}
          </p>
        </div>

        <div className="space-y-4">
          <DetailRow icon={<FileText size={18} />} label="Mövzu" value={quizName} color="blue" />
          <DetailRow icon={<CheckCircle size={18} />} label="Doğru Cavablar" value={`${score} / ${total}`} color="purple" />
          <DetailRow icon={<Calendar size={18} />} label="Tarix" value={date} color="orange" />
        </div>
      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-100">
        <button onClick={() => window.print()} className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition transform active:scale-95 flex items-center justify-center gap-2">
          <Download size={20} />
          Nəticəni Yadda Saxla
        </button>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value, color }: any) {
  const colors: any = { blue: "bg-blue-100 text-blue-600", purple: "bg-purple-100 text-purple-600", orange: "bg-orange-100 text-orange-600" };
  return (
    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md transition duration-200 border border-transparent hover:border-gray-100">
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>{icon}</div>
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
}
