"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LogOut, User, BarChart3, GraduationCap, Calendar, 
  TrendingUp, Activity, PieChart, PenTool, Trophy, Medal, Award
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AVATARS = [
  "👨‍🎓", "👩‍🎓", "🧑‍💻", "👩‍🚀", "🦸‍♂️", "🧝‍♀️", "🧙‍♂️", "🕵️‍♂️", "👩‍🔬", "👨‍🎨"
];

export default function StudentCabinet() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [student, setStudent] = useState<any>(null);
  const [groupName, setGroupName] = useState("...");
  const [teacherName, setTeacherName] = useState("...");
  const [stats, setStats] = useState({ avgScore: "0", attendance: "0" });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentGrades, setRecentGrades] = useState<any[]>([]);
  
  // UI States
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedAvatar, setSelectedAvatar] = useState("👨‍🎓");
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/student/dashboard");
      
      if (res.status === 401 || res.status === 403) {
        router.push("/student-login");
        return;
      }

      const data = await res.json();
      
      if (data.student) {
        setStudent(data.student);
        setGroupName(data.groupName);
        setTeacherName(data.teacherName);
        setStats(data.stats);
        setChartData(data.chartData);
        setRecentGrades(data.recentGrades);
        
        // Avatar Logic
        const savedAvatar = localStorage.getItem(`avatar_${data.student.id}`);
        if (savedAvatar) {
            setSelectedAvatar(savedAvatar);
        } else {
            const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
            setSelectedAvatar(randomAvatar);
            localStorage.setItem(`avatar_${data.student.id}`, randomAvatar);
        }
      }
    } catch (error) {
      console.error("Data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (avatar: string) => {
      setSelectedAvatar(avatar);
      if(student) localStorage.setItem(`avatar_${student.id}`, avatar);
      setIsAvatarMenuOpen(false);
  };

  const handleLogout = () => {
    // Cookie-ni server tərəfli silmək ən yaxşısıdır, amma burda manual silirik
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push("/student-login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-indigo-600 font-bold animate-pulse">Kabinet Yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* NAVBAR */}
      <nav className="bg-white px-6 py-4 shadow-sm border-b sticky top-0 z-50 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-700 flex items-center gap-2">
            <GraduationCap /> Şagird Paneli
        </h1>
        <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-800">{student?.first_name} {student?.last_name}</p>
                <p className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded inline-block mt-1">
                    {groupName} | {teacherName}
                </p>
            </div>
            <div className="relative">
                <button onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)} className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-2xl border-
