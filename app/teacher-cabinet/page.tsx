"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx"; 
import { 
  LogOut, Users, BookOpen, Plus, Calendar, Save, 
  ChevronRight, GraduationCap, CheckCircle, XCircle, AlertTriangle, 
  Trash2, Pencil, RefreshCcw, BarChart3, TrendingUp, Activity, PieChart, 
  Upload, Clock, CheckSquare, Square,
  ChevronLeft, X, LayoutDashboard, Search, Key, UserCheck, CalendarPlus 
} from "lucide-react";

// RECHARTS
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar 
} from 'recharts';

// --- SABITLƏR ---
const WEEK_DAYS = ["B.e", "Ç.a", "Çərş", "C.a", "Cüm", "Şən", "Baz"];
const DAY_MAP: { [key: number]: string } = { 1: "B.e", 2: "Ç.a", 3: "Çərş", 4: "C.a", 5: "Cüm", 6: "Şən", 0: "Baz" };
const DAY_INDEX_MAP: { [key: string]: number } = { 
  "B.e": 0, "Ç.a": 1, "Çərş": 2, "C.a": 3, "Cüm": 4, "Şən": 5, "Baz": 6 
};

// JS günlərini (0-6) sənin cədvəl formatına (B.e, Ç.a...) çeviririk
const JS_DAY_TO_AZ: { [key: number]: string } = { 
  1: "B.e", 2: "Ç.a", 3: "Çərş", 4: "C.a", 5: "Cüm", 6: "Şən", 0: "Baz" 
};

const START_HOUR = 8; 
const END_HOUR = 23;   
const TOTAL_HOURS = END_HOUR - START_HOUR;
const PIXELS_PER_HOUR = 80; 

const PHONE_PREFIXES = ["050", "051", "055", "070", "077", "099", "010", "060"]; 
const GRADES = Array.from({ length: 11 }, (_, i) => i + 1); 
const SECTORS = ["Az", "Ru", "Eng"];

const TIME_SLOTS: string[] = [];
for (let i = START_HOUR; i < END_HOUR; i++) {
  const hour = i.toString().padStart(2, '0');
  TIME_SLOTS.push(`${hour}:00`);
  TIME_SLOTS.push(`${hour}:30`); 
}
TIME_SLOTS.push("00:00");

export default function TeacherCabinet() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Loading state for save actions
  const [teacher, setTeacher] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  // DATA
  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [studentSearch, setStudentSearch] = useState(""); 
  const [studentAddSearch, setStudentAddSearch] = useState(""); 
  const [myStudentSearch, setMyStudentSearch] = useState(""); 

  // CƏDVƏL & STATUS & EXTRA
  const [scheduleEvents, setScheduleEvents] = useState<any[]>([]);
  const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
  const [selectedEventForStatus, setSelectedEventForStatus] = useState<any>(null);
  const [lessonStatusOverrides, setLessonStatusOverrides] = useState<{[key: string]: string}>({});
  const [extraLessons, setExtraLessons] = useState<any[]>([]); 
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // EXTRA LESSON MODAL
  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false);
  const [newExtraLesson, setNewExtraLesson] = useState({
      group_id: "", 
      lesson_date: new Date().toISOString().split('T')[0], 
      start_time: "10:00", 
      end_time: "11:30"
  });

  // FORM & EDIT
  const [editingId, setEditingId] = useState<number | null>(null);
  const [phonePrefix, setPhonePrefix] = useState("050");
  const [newStudent, setNewStudent] = useState({
    first_name: "", last_name: "", father_name: "", phone: "", school: "", grade: "", sector: "Az", start_date: new Date().toISOString().split('T')[0], access_code: ""
  });
  const [newGroupName, setNewGroupName] = useState("");
  const [tempDay, setTempDay] = useState("B.e"); 
  const [tempTime, setTempTime] = useState("09:00"); 
  const [tempEndTime, setTempEndTime] = useState("10:30");
  const [scheduleSlots, setScheduleSlots] = useState<{day: string, time: string}[]>([]);

  // JURNAL & ANALİZ
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [groupStudents, setGroupStudents] = useState<any[]>([]);
  const [studentToAdd, setStudentToAdd] = useState("");
  const [gradingDate, setGradingDate] = useState(new Date().toISOString().split('T')[0]);
  const [grades, setGrades] = useState<{[key: string]: string}>({});
  const [attendance, setAttendance] = useState<{[key: string]: boolean}>({});
  const [isValidDay, setIsValidDay] = useState(true); 
  
  // ANALİZ
  const [analyticsGroupId, setAnalyticsGroupId] = useState<string>("");
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [groupStats, setGroupStats] = useState({ avgScore: 0, avgAttendance: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [analysisMode, setAnalysisMode] = useState<'group' | 'individual'>('group'); 
  const [selectedStudentForChart, setSelectedStudentForChart] = useState<string>(""); 
  const [chartInterval, setChartInterval] = useState<'lessons4' | 'weeks4' | 'months4' | 'year'>('lessons4'); 
  const [analyticsStudentsList, setAnalyticsStudentsList] = useState<any[]>([]); 
  const [rawGradesForChart, setRawGradesForChart] = useState<any[]>([]); 

  // --- INIT ---
  useEffect(() => {
    const today = new Date();
    const day = today.getDay(); 
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(today.setDate(diff));
    setCurrentWeekStart(monday);

    const initData = async () => {
        try {
            const res = await fetch("/api/teacher/dashboard");
            if (res.status === 401 || res.status === 403) {
                router.push("/login");
                return;
            }
            const data = await res.json();
            if (data.teacher) {
                setTeacher(data.teacher);
                fetchData(data.teacher.id);
                fetchScheduleData(); // 🔥 Statusları və Əlavə dərsləri çək
            }
        } catch (error) {
            router.push("/login");
        } finally {
            setLoading(false);
        }
    };
    initData();

    const updateTimeLine = () => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();
        if (currentHour >= START_HOUR && currentHour < END_HOUR) {
            const hoursPassed = currentHour - START_HOUR;
            const minutesPixel = (currentMin / 60) * PIXELS_PER_HOUR;
            setCurrentTimePosition((hoursPassed * PIXELS_PER_HOUR) + minutesPixel);
        } else {
            setCurrentTimePosition(null);
        }
    };
    updateTimeLine();
    const interval = setInterval(updateTimeLine, 60000);

    setTimeout(() => {
        if (scrollContainerRef.current) {
            const targetHour = 14; 
            if (targetHour >= START_HOUR) {
                scrollContainerRef.current.scrollTop = (targetHour - START_HOUR) * PIXELS_PER_HOUR;
            }
        }
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  // 🔥 API-dan Schedule Datalarını almaq
  const fetchScheduleData = async () => {
      try {
          const res = await fetch("/api/teacher/schedule");
          if (res.ok) {
              const data = await res.json();
              
              const statusMap: {[key: string]: string} = {};
              data.lessonStatuses.forEach((item: any) => {
                  const key = `${item.group_id}_${item.lesson_date.split('T')[0]}`;
                  statusMap[key] = item.status;
              });
              setLessonStatusOverrides(statusMap);
              setExtraLessons(data.extraLessons || []);
          }
      } catch (error) {
          console.error("Schedule data error", error);
      }
  };

  // --- CƏDVƏL MƏNTİQİ ---
  useEffect(() => {
      const events: any[] = [];
      const now = new Date();
      const weekDates: Date[] = [];
      for(let i=0; i<7; i++) {
        const d = new Date(currentWeekStart);
        d.setDate(currentWeekStart.getDate() + i);
        weekDates.push(d);
      }

      // 1. REGULAR SCHEDULE
      groups.forEach(group => {
          if(!group.schedule) return;
          const slots = group.schedule.split(", ");
          slots.forEach((slot: string) => {
              const parts = slot.split(" ");
              if(parts.length === 2) {
                  const dayName = parts[0];
                  const timeRange = parts[1];
                  const dayIndex = DAY_INDEX_MAP[dayName];
                  
                  if (dayIndex !== undefined) {
                      const [startStr, endStr] = timeRange.includes("-") ? timeRange.split("-") : [timeRange, null];
                      if(startStr) {
                        const [h, m] = startStr.split(":").map(Number);
                        let duration = 1.5; 
                        let endH = h + 1, endM = m + 30;
                        if (endStr) {
                            const [eH, eM] = endStr.split(":").map(Number);
                            duration = (eH + eM / 60) - (h + m / 60);
                            endH = eH; endM = eM;
                        }

                        const specificDate = weekDates[dayIndex];
                        const dateString = specificDate.toISOString().split('T')[0];
                        const statusKey = `${group.id}_${dateString}`;
                        const lessonStart = new Date(specificDate); lessonStart.setHours(h, m, 0);
                        const lessonEnd = new Date(specificDate); lessonEnd.setHours(endH, endM, 0);
                        const manualStatus = lessonStatusOverrides[statusKey];

                        let statusColor = "bg-[#F5B041] border-[#D68910] text-white"; 
                        let statusText = "Planlaşdırılıb";

                        if (manualStatus === 'done') {
                            statusColor = "bg-green-600 border-green-800 text-white";
                            statusText = "Keçirildi";
                        } else if (manualStatus === 'cancelled') {
                            statusColor = "bg-red-500 border-red-700 text-white opacity-60";
                            statusText = "Ləğv edildi";
                        } else {
                            if (lessonEnd < now) {
                                statusColor = "bg-gray-400 border-gray-600 text-white opacity-80"; 
                                statusText = "Bitdi";
                            } else if (lessonStart <= now && lessonEnd >= now) {
                                statusColor = "bg-[#3498DB] border-[#2980B9] text-white animate-pulse shadow-lg ring-2 ring-blue-300";
                                statusText = "Davam edir...";
                            }
                        }

                        const top = ((h - START_HOUR) * PIXELS_PER_HOUR) + ((m / 60) * PIXELS_PER_HOUR);
                        events.push({
                            uniqueId: statusKey,
                            groupId: group.id,
                            groupName: group.name,
                            dayIndex, 
                            top, 
                            height: duration * PIXELS_PER_HOUR,
                            timeStr: timeRange,
                            classes: `absolute inset-x-1 rounded-md cursor-pointer z-10 border-l-4 shadow-sm text-xs font-medium p-2 flex flex-col justify-center overflow-hidden transition hover:brightness-95 ${statusColor}`,
                            status: statusText,
                            fullDate: specificDate,
                            manualStatus,
                            isExtra: false
                        });
                      }
                  }
              }
          });
      });

      // 2. EXTRA LESSONS (MERGE)
      extraLessons.forEach(el => {
         const elDate = new Date(el.lesson_date);
         const startOfWeek = weekDates[0];
         const endOfWeek = weekDates[6];

         if (elDate >= startOfWeek && elDate <= endOfWeek) {
             const dayIndex = elDate.getDay() === 0 ? 6 : elDate.getDay() - 1; 
             const [h, m] = el.start_time.split(":").map(Number);
             const [eH, eM] = el.end_time.split(":").map(Number);
             const duration = (eH + eM / 60) - (h + m / 60);

             const dateString = el.lesson_date;
             const statusKey = `${el.group_id}_${dateString}`;
             const manualStatus = lessonStatusOverrides[statusKey];
             const group = groups.find(g => g.id === el.group_id);

             let statusColor = "bg-purple-600 border-purple-800 text-white shadow-purple-200"; 
             let statusText = "Əlavə Dərs";

             if (manualStatus === 'done') { statusColor = "bg-green-600 border-green-800 text-white"; statusText = "Keçirildi"; }
             else if (manualStatus === 'cancelled') { statusColor = "bg-red-500 border-red-700 text-white opacity-60"; statusText = "Ləğv edildi"; }

             const top = ((h - START_HOUR) * PIXELS_PER_HOUR) + ((m / 60) * PIXELS_PER_HOUR);

             events.push({
                 uniqueId: statusKey,
                 groupId: el.group_id,
                 groupName: group ? `${group.name} (Əlavə)` : "Əlavə",
                 dayIndex,
                 top,
                 height: duration * PIXELS_PER_HOUR,
                 timeStr: `${el.start_time.slice(0,5)}-${el.end_time.slice(0,5)}`,
                 classes: `absolute inset-x-1 rounded-md cursor-pointer z-10 border-l-4 shadow-sm text-xs font-medium p-2 flex flex-col justify-center overflow-hidden transition hover:brightness-95 ${statusColor}`,
                 status: statusText,
                 fullDate: elDate,
                 manualStatus,
                 isExtra: true
             });
         }
      });

      setScheduleEvents(events);
  }, [groups, currentWeekStart, lessonStatusOverrides, extraLessons]);

  const changeWeek = (direction: number) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentWeekStart(newDate);
  };

  const handleEventClick = (event: any) => {
      setSelectedEventForStatus(event);
  };

  // 🔥 FIX: STATUS YENİLƏMƏK (API İLƏ)
  const updateEventStatus = async (status: string | null) => {
      if (!selectedEventForStatus) return;
      const groupId = selectedEventForStatus.groupId;
      const dateString = selectedEventForStatus.fullDate.toISOString().split('T')[0];
      const mapKey = `${groupId}_${dateString}`;
      
      const newOverrides = { ...lessonStatusOverrides };
      if (status === null) delete newOverrides[mapKey];
      else newOverrides[mapKey] = status;
      setLessonStatusOverrides(newOverrides);
      setSelectedEventForStatus(null);

      try {
          const res = await fetch("/api/teacher/schedule", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: 'status', groupId, date: dateString, status })
          });
          if (!res.ok) throw new Error("Status yadda saxlanmadı");
      } catch (error) { 
          alert("Xəta baş verdi! İnterneti yoxlayın."); 
          fetchScheduleData(); // Revert
      }
  };

  // 🔥 FIX: ƏLAVƏ DƏRS YARATMAQ
  const createExtraLesson = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!newExtraLesson.group_id) return alert("Qrup seçin!");

      setIsSaving(true);
      try {
          const res = await fetch("/api/teacher/schedule", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: 'extra_lesson', ...newExtraLesson })
          });
          
          const data = await res.json();
          if(res.ok) {
              alert("✅ Əlavə dərs yaradıldı!");
              setIsExtraModalOpen(false);
              fetchScheduleData();
          } else {
              alert("❌ Xəta: " + (data.error || "Bilinməyən xəta"));
          }
      } catch(e) { alert("Server xətası!"); }
      finally { setIsSaving(false); }
  };

  // --- HELPERS ---
  const fetchData = async (teacherId: number) => { try { const res = await fetch("/api/teacher/students"); if (res.ok) { const data = await res.json(); setStudents(data.students || []); } const resG = await fetch("/api/teacher/groups"); if (resG.ok) { const dataG = await resG.json(); setGroups(dataG.groups || []); } } catch (e) { console.error(e); } };
  const toggleSelectAll = () => { if (selectedIds.length === students.length) setSelectedIds([]); else setSelectedIds(students.map(s => s.id)); };
  const toggleSelectOne = (id: number) => { if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(sid => sid !== id)); else setSelectedIds([...selectedIds, id]); };
  
  const myStudents = students.filter(s => s.teacher_id === teacher?.id);
  const toggleSelectMyStudent = (id: number) => { if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(sid => sid !== id)); else setSelectedIds([...selectedIds, id]); };
  const toggleSelectAllMyStudents = () => { if (selectedIds.length === myStudents.length) setSelectedIds([]); else setSelectedIds(myStudents.map(s => s.id)); };

  const bulkDelete = async () => { if (!confirm(`Seçilmiş ${selectedIds.length} şagirdi silmək istədiyinizə əminsiniz?`)) return; try { const res = await fetch("/api/teacher/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: 'bulk_delete', ids: selectedIds }) }); if (!res.ok) throw new Error("Silinmə xətası"); alert("Silindi!"); setSelectedIds([]); if(teacher) fetchData(teacher.id); } catch (error: any) { alert(error.message); } };
  const generateAccessCode = () => { const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let result = ""; for (let i = 0; i < 6; i++) { result += chars.charAt(Math.floor(Math.random() * chars.length)); } setNewStudent({...newStudent, access_code: result}); };

  // --- JURNAL VALIDATION (DƏYİŞDİRİLDİ) ---
  const checkScheduleValidity = () => { 
      if (!selectedGroup || !gradingDate) return; 
      
      const d = new Date(gradingDate);
      const dayIndex = d.getDay(); 
      const dayName = JS_DAY_TO_AZ[dayIndex]; 
      const dateStr = gradingDate;

      // 1. Standart Cədvəldə varmı?
      const isRegular = selectedGroup.schedule && selectedGroup.schedule.includes(dayName);
      
      // 2. Əlavə Dərs kimi varmı?
      const isExtra = extraLessons.some(el => el.group_id === selectedGroup.id && el.lesson_date === dateStr);

      if (isRegular || isExtra) {
          setIsValidDay(true);
      } else {
          setIsValidDay(false);
      }
  };

  useEffect(() => { if (selectedGroup && gradingDate) { checkScheduleValidity(); fetchGradesForDate(); } }, [gradingDate, selectedGroup]);
  
  // ... (Analytics funksiyaları eyni qalır) ...
  const calculateAnalytics = async (groupId: string) => { if (!groupId) return; setAnalyticsGroupId(groupId); try { const resMembers = await fetch(`/api/teacher/jurnal?type=members&groupId=${groupId}`); const dataMembers = await resMembers.json(); const studentsInGroup = dataMembers.students || []; setAnalyticsStudentsList(studentsInGroup); const resGrades = await fetch(`/api/teacher/jurnal?type=analytics&groupId=${groupId}`); const dataGrades = await resGrades.json(); const allGrades = dataGrades.allGrades || []; setRawGradesForChart(allGrades); calculateTableStats(studentsInGroup, allGrades); } catch(e) { console.error(e); } };
  const calculateTableStats = (studentsInGroup: any[], allGrades: any[]) => { let totalGroupScore = 0; let totalGroupAttendance = 0; let scoreCount = 0; let attendanceCount = 0; const stats = studentsInGroup.map((student: any) => { const studentGrades = allGrades.filter((g: any) => g.student_id === student.id); const scoredDays = studentGrades.filter((g: any) => g.score !== null); const avgScore = scoredDays.length > 0 ? scoredDays.reduce((acc: number, curr: any) => acc + curr.score, 0) / scoredDays.length : 0; const totalDays = studentGrades.length; const presentDays = studentGrades.filter((g: any) => g.attendance === true).length; const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0; if (scoredDays.length > 0) { totalGroupScore += avgScore; scoreCount++; } if (totalDays > 0) { totalGroupAttendance += attendanceRate; attendanceCount++; } return { ...student, avgScore: avgScore.toFixed(1), attendanceRate: attendanceRate.toFixed(0) }; }); stats.sort((a: any, b: any) => parseFloat(b.avgScore) - parseFloat(a.avgScore)); setAnalyticsData(stats); setGroupStats({ avgScore: scoreCount > 0 ? parseFloat((totalGroupScore / scoreCount).toFixed(1)) : 0, avgAttendance: attendanceCount > 0 ? parseFloat((totalGroupAttendance / attendanceCount).toFixed(0)) : 0 }); };
  useEffect(() => { if (rawGradesForChart.length === 0) return; let filteredData = [...rawGradesForChart]; if (analysisMode === 'individual' && selectedStudentForChart) { filteredData = filteredData.filter(g => g.student_id.toString() === selectedStudentForChart.toString()); } if (chartInterval === 'year') { const currentYear = new Date().getFullYear(); filteredData = filteredData.filter(g => new Date(g.grade_date).getFullYear() === currentYear); } const groupedData: { [key: string]: number[] } = {}; const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "İyn", "İyl", "Avq", "Sen", "Okt", "Noy", "Dek"]; filteredData.forEach((g: any) => { if (g.score !== null) { const date = new Date(g.grade_date); let key = g.grade_date; if (chartInterval === 'weeks4') { const startOfYear = new Date(date.getFullYear(), 0, 1); const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)); const weekNum = Math.ceil((days + 1) / 7); key = `Həftə ${weekNum}`; } else if (chartInterval === 'months4') { key = monthNames[date.getMonth()]; } else if (chartInterval === 'year') { key = monthNames[date.getMonth()]; } if (!groupedData[key]) groupedData[key] = []; groupedData[key].push(g.score); } }); let chartResult = Object.keys(groupedData).map(key => { const scores = groupedData[key]; const avg = scores.reduce((a, b) => a + b, 0) / scores.length; return { label: key, avg: parseFloat(avg.toFixed(1)) }; }); if (chartInterval === 'lessons4') { chartResult.sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime()); chartResult = chartResult.slice(-4); chartResult = chartResult.map(item => ({...item, label: item.label.slice(5)})); } else if (chartInterval === 'weeks4') { chartResult = chartResult.slice(-4); } else if (chartInterval === 'months4') { chartResult = chartResult.slice(-4); } else if (chartInterval === 'year') { chartResult.sort((a, b) => monthNames.indexOf(a.label) - monthNames.indexOf(b.label)); } setChartData(chartResult); }, [chartInterval, analysisMode, selectedStudentForChart, rawGradesForChart]);
  const getDisplayStats = () => { if (analysisMode === 'individual' && selectedStudentForChart) { const studentStat = analyticsData.find(s => s.id.toString() === selectedStudentForChart.toString()); if (studentStat) { return { title: "Şagird Ortalaması", score: studentStat.avgScore, attendance: studentStat.attendanceRate, isIndividual: true }; } } return { title: "Qrup Ortalaması", score: groupStats.avgScore, attendance: groupStats.avgAttendance, isIndividual: false }; }; const displayStats = getDisplayStats();
  const filteredStudents = students.filter(s => { const fullName = `${s.first_name} ${s.last_name} ${s.father_name || ''}`.toLowerCase(); const code = s.student_code ? s.student_code.toString() : ''; return fullName.includes(studentSearch.toLowerCase()) || code.includes(studentSearch); });
  const filteredMyStudents = myStudents.filter(s => { const fullName = `${s.first_name} ${s.last_name} ${s.father_name || ''}`.toLowerCase(); const code = s.student_code ? s.student_code.toString() : ''; return fullName.includes(myStudentSearch.toLowerCase()) || code.includes(myStudentSearch); });
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { if (!e.target.files || e.target.files.length === 0) return; setUploading(true); const file = e.target.files[0]; const reader = new FileReader(); reader.onload = async (evt) => { try { const data = evt.target?.result; const wb = XLSX.read(data, { type: "array" }); const wsname = wb.SheetNames[0]; const ws = wb.Sheets[wsname]; const jsonData = XLSX.utils.sheet_to_json(ws); const res = await fetch("/api/teacher/students/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ students: jsonData }) }); const result = await res.json(); if (!res.ok) throw new Error(result.error || "Yükləmə xətası"); alert(`✅ Uğurla yükləndi! ${result.count} şagird əlavə olundu.`); if(teacher) fetchData(teacher.id); } catch (error: any) { alert("❌ Xəta: " + error.message); } finally { setUploading(false); e.target.value = ""; } }; reader.readAsArrayBuffer(file); };
  const handleAddOrUpdateStudent = async (e: React.FormEvent) => { e.preventDefault(); const formattedPhone = `+994${phonePrefix.slice(1)}${newStudent.phone}`; const studentPayload = { ...newStudent, phone: formattedPhone, student_code: editingId ? undefined : Math.floor(Math.random() * 10000) + 1 }; try { const res = await fetch("/api/teacher/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: editingId ? 'update' : 'create', id: editingId, studentData: studentPayload }) }); const result = await res.json(); if (!res.ok) throw new Error(result.error); alert(editingId ? "Yeniləndi!" : "Əlavə edildi!"); resetForm(); if(teacher) fetchData(teacher.id); } catch (error: any) { alert("Xəta: " + error.message); } };
  const deleteStudent = async (id: number) => { if (!confirm("Silinsin?")) return; try { const res = await fetch("/api/teacher/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: 'delete', id: id }) }); if (!res.ok) throw new Error("Silinmə xətası"); if(teacher) fetchData(teacher.id); } catch (error: any) { alert(error.message); } };
  const resetForm = () => { setNewStudent({ first_name: "", last_name: "", father_name: "", phone: "", school: "", grade: "", sector: "Az", start_date: new Date().toISOString().split('T')[0], access_code: "" }); setPhonePrefix("050"); setEditingId(null); };
  const startEdit = (student: any) => { const rawPhone = student.phone || ""; let pPrefix = "050"; let pNumber = ""; if (rawPhone.startsWith("+994")) { pPrefix = "0" + rawPhone.substring(4, 6); pNumber = rawPhone.substring(6); } setNewStudent({ first_name: student.first_name, last_name: student.last_name, father_name: student.father_name || "", phone: pNumber, school: student.school || "", grade: student.grade || "", sector: student.sector || "Az", start_date: student.start_date, access_code: student.access_code || "" }); setPhonePrefix(pPrefix); setEditingId(student.id); };
  const addScheduleSlot = () => { if (!tempTime || !tempEndTime) return; if (tempTime >= tempEndTime) { alert("Bitmə vaxtı başlama vaxtından sonra olmalıdır!"); return; } setScheduleSlots([...scheduleSlots, { day: tempDay, time: `${tempTime}-${tempEndTime}` }]); };
  const removeSlot = (index: number) => { const newSlots = [...scheduleSlots]; newSlots.splice(index, 1); setScheduleSlots(newSlots); };
  const handleCreateGroup = async (e: React.FormEvent) => { e.preventDefault(); if (scheduleSlots.length === 0) return; const finalSchedule = scheduleSlots.map(s => `${s.day} ${s.time}`).join(", "); try { const res = await fetch("/api/teacher/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newGroupName, schedule: finalSchedule }) }); if (!res.ok) { const err = await res.json(); throw new Error(err.error); } alert("Yarandı!"); setNewGroupName(""); setScheduleSlots([]); if(teacher) fetchData(teacher.id); } catch (e: any) { alert(e.message); } };
  const openGroup = (group: any) => { setSelectedGroup(group); fetchGroupMembers(group.id); setGradingDate(new Date().toISOString().split('T')[0]); setStudentToAdd(""); setStudentAddSearch(""); };
  const fetchGroupMembers = async (groupId: number) => { try { const res = await fetch(`/api/teacher/jurnal?type=members&groupId=${groupId}`); if (res.ok) { const data = await res.json(); setGroupStudents(data.students || []); } } catch (e) { console.error(e); } };
  const fetchGradesForDate = async () => { if (!selectedGroup) return; setGrades({}); setAttendance({}); try { const res = await fetch(`/api/teacher/jurnal?type=grades&groupId=${selectedGroup.id}&date=${gradingDate}`); if (res.ok) { const data = await res.json(); const nG: any = {}, nA: any = {}; if (data.grades) { data.grades.forEach((r: any) => { if (r.score !== null) nG[r.student_id] = r.score; nA[r.student_id] = r.attendance; }); setGrades(nG); setAttendance(nA); } } } catch (e) { console.error(e); } };
  const addStudentToGroup = async () => { if (!studentToAdd || !selectedGroup) return; try { const res = await fetch("/api/teacher/jurnal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: 'add_member', groupId: selectedGroup.id, studentId: studentToAdd }) }); if (!res.ok) throw new Error("Əlavə edilmədi"); alert("Əlavə olundu!"); fetchGroupMembers(selectedGroup.id); setStudentToAdd(""); setStudentAddSearch(""); } catch (e: any) { alert(e.message); } };
  const saveGrades = async () => { if (!selectedGroup) return; if (!isValidDay && !confirm("Dərs günü deyil. Davam?")) return; const updates = groupStudents.map(student => ({ group_id: selectedGroup.id, student_id: student.id, grade_date: gradingDate, score: grades[student.id] ? parseInt(grades[student.id]) : null, attendance: attendance[student.id] !== false })); try { const res = await fetch("/api/teacher/jurnal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: 'save_grades', groupId: selectedGroup.id, date: gradingDate, gradesData: updates }) }); if (!res.ok) throw new Error("Xəta"); alert("Saxlanıldı!"); } catch (e: any) { alert(e.message); } };
  const toggleAttendance = (studentId: string) => { const currentStatus = attendance[studentId] !== false; setAttendance({ ...attendance, [studentId]: !currentStatus }); };
  const handleLogout = async () => { try { await fetch("/api/logout", { method: "POST" }); router.push("/login"); router.refresh(); } catch { router.push("/login"); } };

  if (loading) return ( <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50"> <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div> <p className="text-blue-600 font-bold text-lg animate-pulse">Kabinet Yüklənir...</p> </div> );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-100 font-sans">
      
      {/* --- EXTRA LESSON MODAL --- */}
      {isExtraModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full border dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold flex items-center gap-2"><CalendarPlus className="text-purple-600"/> Əlavə Dərs</h3>
                      <button onClick={() => setIsExtraModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                  </div>
                  <form onSubmit={createExtraLesson} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Qrup</label>
                          <select required className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700" value={newExtraLesson.group_id} onChange={e => setNewExtraLesson({...newExtraLesson, group_id: e.target.value})}>
                              <option value="">Seçin...</option>
                              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Tarix</label>
                          <input required type="date" className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700" value={newExtraLesson.lesson_date} onChange={e => setNewExtraLesson({...newExtraLesson, lesson_date: e.target.value})}/>
                      </div>
                      <div className="flex gap-2">
                          <div className="flex-1">
                             <label className="text-xs font-bold text-gray-500 uppercase">Başlama</label>
                             <select className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700" value={newExtraLesson.start_time} onChange={e => setNewExtraLesson({...newExtraLesson, start_time: e.target.value})}>
                                {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                             </select>
                          </div>
                          <div className="flex-1">
                             <label className="text-xs font-bold text-gray-500 uppercase">Bitmə</label>
                             <select className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700" value={newExtraLesson.end_time} onChange={e => setNewExtraLesson({...newExtraLesson, end_time: e.target.value})}>
                                {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                             </select>
                          </div>
                      </div>
                      <button type="submit" disabled={isSaving} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                          {isSaving ? "Yaradılır..." : "Yarat"}
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* --- STATUS MODAL --- */}
      {selectedEventForStatus && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full border dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">{selectedEventForStatus.groupName}</h3>
                      <button onClick={() => setSelectedEventForStatus(null)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                  </div>
                  <p className="text-gray-500 mb-6 text-sm">
                      {selectedEventForStatus.fullDate.toLocaleDateString('az-AZ')} | {selectedEventForStatus.timeStr}
                  </p>
                  <div className="space-y-3">
                      <button onClick={() => updateEventStatus('done')} className="w-full p-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg shadow-green-200">
                          <CheckCircle size={20}/> Keçirildi
                      </button>
                      <button onClick={() => updateEventStatus('cancelled')} className="w-full p-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 flex items-center justify-center gap-2 shadow-lg shadow-red-200">
                          <XCircle size={20}/> Ləğv edildi
                      </button>
                      <button onClick={() => updateEventStatus(null)} className="w-full p-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 flex items-center justify-center gap-2">
                          <RefreshCcw size={18}/> Sıfırla
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- NAVBAR --- */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-40 h-[80px]">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><BookOpen className="text-blue-600" /> Kabinet</h1>
        
        <div className="hidden md:flex gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
            {['dashboard', 'schedule', 'students', 'my_students', 'groups', 'analytics'].map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition ${activeTab === tab ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-300 hover:bg-white/50'}`}>
                    {tab === 'dashboard' && <LayoutDashboard size={16} />}
                    {tab === 'schedule' && <Clock size={16} />}
                    {tab === 'students' && <GraduationCap size={16} />}
                    {tab === 'my_students' && <UserCheck size={16} />}
                    {tab === 'groups' && <BookOpen size={16} />}
                    {tab === 'analytics' && <BarChart3 size={16} />}
                    <span className="capitalize">
                        {tab === 'dashboard' ? 'Ana Səhifə' : 
                         tab === 'schedule' ? 'Cədvəl' : 
                         tab === 'students' ? 'Bütün Şagirdlər' : 
                         tab === 'my_students' ? 'Mənim Şagirdlərim' :
                         tab === 'groups' ? 'Jurnal' : 'Analiz'}
                    </span>
                 </button>
            ))}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full hidden lg:block">👤 {teacher?.full_name || teacher?.username}</span>
          <button onClick={handleLogout} className="text-red-500 hover:text-red-700 font-medium"><LogOut size={18} /></button>
        </div>
      </nav>

      {/* MOBILE TABS */}
      <div className="md:hidden flex overflow-x-auto gap-2 p-2 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          {['dashboard', 'schedule', 'students', 'my_students', 'groups', 'analytics'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 whitespace-nowrap transition ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                  <span className="capitalize">{tab === 'my_students' ? 'Şagirdlərim' : tab}</span>
              </button>
          ))}
      </div>

      <main className="p-4 md:p-6 h-[calc(100vh-80px)] overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-900">

        {/* --- DASHBOARD --- */}
        {activeTab === 'dashboard' && (
            <div className="overflow-auto h-full pb-20 animate-in fade-in max-w-7xl mx-auto w-full">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg mb-8">
                    <h2 className="text-3xl font-bold mb-2">Xoş Gəldiniz, Müəllim! 👋</h2>
                    <p className="opacity-90">{new Date().toLocaleDateString('az-AZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                {/* YENİ KARTLAR SİSTEMİ */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div onClick={() => setActiveTab('schedule')} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition cursor-pointer flex items-center gap-4 group">
                        <div className="p-4 bg-orange-50 text-orange-600 rounded-xl group-hover:scale-110 transition"><Clock size={32} /></div>
                        <div><h3 className="text-xl font-bold">Dərs Cədvəli</h3><p className="text-sm text-gray-500">Həftəlik plan</p></div>
                    </div>
                    <div onClick={() => setActiveTab('students')} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition cursor-pointer flex items-center gap-4 group">
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition"><Users size={32} /></div>
                        <div><h3 className="text-xl font-bold">Şagirdlər</h3><p className="text-sm text-gray-500">{students.length} şagird</p></div>
                    </div>
                    <div onClick={() => setActiveTab('groups')} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition cursor-pointer flex items-center gap-4 group">
                        <div className="p-4 bg-green-50 text-green-600 rounded-xl group-hover:scale-110 transition"><BookOpen size={32} /></div>
                        <div><h3 className="text-xl font-bold">Jurnal</h3><p className="text-sm text-gray-500">{groups.length} qrup</p></div>
                    </div>
                    <div onClick={() => setActiveTab('analytics')} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition cursor-pointer flex items-center gap-4 group">
                        <div className="p-4 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition"><BarChart3 size={32} /></div>
                        <div><h3 className="text-xl font-bold">Analiz</h3><p className="text-sm text-gray-500">Hesabatlar</p></div>
                    </div>
                </div>
            </div>
        )}

        {/* --- SCHEDULE --- */}
        {activeTab === 'schedule' && (
            <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 shadow-sm overflow-hidden animate-in fade-in max-w-[1600px] mx-auto w-full">
                <div className="p-4 flex justify-between items-center border-b dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0 z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={() => { const d = new Date(); setCurrentWeekStart(new Date(d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1)))) }} className="px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Bugün</button>
                        <div className="flex items-center gap-2">
                            <button onClick={() => changeWeek(-1)} className="p-1.5 hover:bg-gray-100 rounded-full"><ChevronLeft size={20}/></button>
                            <button onClick={() => changeWeek(1)} className="p-1.5 hover:bg-gray-100 rounded-full"><ChevronRight size={20}/></button>
                        </div>
                        <h2 className="text-lg font-bold">
                            {currentWeekStart.toLocaleDateString('az-AZ', { month: 'long', year: 'numeric' })}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex gap-4 text-xs font-bold text-gray-500">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F5B041]"></span> Plan</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-600"></span> Keçirildi</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Ləğv</span>
                        </div>
                        <button onClick={() => setIsExtraModalOpen(true)} className="ml-4 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-md shadow-purple-200">
                            <CalendarPlus size={16}/> Əlavə Dərs
                        </button>
                    </div>
                </div>

                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative bg-white dark:bg-gray-900 scroll-smooth">
                    <div className="min-w-[1000px] relative">
                        <div className="sticky top-0 z-30 flex border-b dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
                            <div className="w-16 shrink-0 border-r dark:border-gray-700 bg-white dark:bg-gray-900"></div> 
                            {WEEK_DAYS.map((day, i) => {
                                const d = new Date(currentWeekStart); d.setDate(d.getDate() + i);
                                const isToday = new Date().toDateString() === d.toDateString();
                                return (
                                    <div key={i} className="flex-1 text-center py-3 border-r dark:border-gray-700">
                                            <div className={`text-xs font-bold uppercase mb-1 ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>{day}</div>
                                            <div className={`w-8 h-8 flex items-center justify-center rounded-full mx-auto text-lg ${isToday ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-800 dark:text-white'}`}>
                                                {d.getDate()}
                                            </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="flex">
                            <div className="w-16 shrink-0 sticky left-0 z-20 bg-white dark:bg-gray-900 border-r dark:border-gray-700 text-xs text-gray-400 font-medium text-right pr-2 pt-2">
                                {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                                    <div key={i} className="relative" style={{ height: `${PIXELS_PER_HOUR}px` }}>
                                        <span className="-top-3 absolute right-2">{START_HOUR + i}:00</span>
                                    </div>
                                ))}
                            </div>

                            {WEEK_DAYS.map((day, i) => (
                                <div key={i} className="flex-1 border-r dark:border-gray-700 relative min-w-[120px]">
                                    {Array.from({ length: TOTAL_HOURS }).map((_, h) => (
                                        <div key={h} className="border-b dark:border-gray-800 border-gray-100" style={{ height: `${PIXELS_PER_HOUR}px` }}></div>
                                    ))}

                                    {scheduleEvents.filter(ev => ev.dayIndex === i).map((ev, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => handleEventClick(ev)}
                                            className={ev.classes}
                                            style={{ top: `${ev.top}px`, height: `${ev.height - 2}px` }}
                                        >
                                            <div className="font-bold truncate text-[11px] leading-tight">{ev.groupName}</div>
                                            <div className="text-[10px] mt-0.5 opacity-90">{ev.timeStr}</div>
                                        </div>
                                    ))}

                                    {currentTimePosition !== null && (new Date().getDay() + 6) % 7 === i && (
                                        <div className="absolute w-full border-t-2 border-red-500 z-10 pointer-events-none" style={{ top: `${currentTimePosition}px` }}>
                                            <div className="w-2 h-2 bg-red-500 rounded-full -mt-[5px] -ml-[1px]"></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- 🔥 YENİLƏNMİŞ STUDENTS TAB (SEARCH & SCROLL) --- */}
        {activeTab === 'students' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in max-w-7xl mx-auto h-full overflow-hidden pb-2">
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 h-full overflow-y-auto">
                    <div className="mb-6 pb-6 border-b dark:border-gray-700">
                        <label className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-green-300 bg-green-50 text-green-700 cursor-pointer hover:bg-green-100 transition ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <Upload size={20} />
                            <span className="font-bold text-sm">{uploading ? "Yüklənir..." : "ZipGrade CSV Yüklə"}</span>
                            <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                        </label>
                        <p className="text-xs text-gray-400 mt-2 text-center">Format: ZipGrade ID, First Name, Last Name, External ID, Access Code, Classes</p>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            {editingId ? <><Pencil size={18} className="text-orange-500"/> Redaktə Et</> : <><Plus size={18}/> Yeni Şagird</>}
                        </h3>
                        {editingId && <button onClick={resetForm} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded"><RefreshCcw size={12}/> Ləğv et</button>}
                    </div>
                    
                    <form onSubmit={handleAddOrUpdateStudent} className="space-y-4">
                        <input required placeholder="Ad" className="w-full p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl outline-none" value={newStudent.first_name} onChange={e => setNewStudent({...newStudent, first_name: e.target.value})} />
                        <input required placeholder="Soyad" className="w-full p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl outline-none" value={newStudent.last_name} onChange={e => setNewStudent({...newStudent, last_name: e.target.value})} />
                        <input placeholder="Ata adı" className="w-full p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl outline-none" value={newStudent.father_name} onChange={e => setNewStudent({...newStudent, father_name: e.target.value})} />
                        <div className="flex gap-2">
                            <select className="w-1/3 p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl outline-none text-sm" value={phonePrefix} onChange={(e) => setPhonePrefix(e.target.value)}>{PHONE_PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}</select>
                            <input placeholder="880 88 88" className="w-2/3 p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl outline-none" value={newStudent.phone} onChange={e => { const val = e.target.value.replace(/\D/g, '').slice(0, 7); setNewStudent({...newStudent, phone: val}) }} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <input placeholder="Məktəb" className="w-full p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl outline-none" value={newStudent.school} onChange={e => setNewStudent({...newStudent, school: e.target.value})} />
                            <select className="w-full p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl outline-none" value={newStudent.grade} onChange={e => setNewStudent({...newStudent, grade: e.target.value})}><option value="">Sinif</option>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select>
                        </div>
                        <div className="flex gap-2">{SECTORS.map(sec => (<button key={sec} type="button" onClick={() => setNewStudent({...newStudent, sector: sec})} className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${newStudent.sector === sec ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-700 text-gray-500"}`}>{sec}</button>))}</div>
                        <input type="date" className="w-full p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl outline-none" value={newStudent.start_date} onChange={e => setNewStudent({...newStudent, start_date: e.target.value})} />
                        
                        <div className="relative">
                            <input 
                                placeholder="Access Code (Giriş Kodu)" 
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl outline-none font-mono tracking-widest text-center uppercase" 
                                value={newStudent.access_code} 
                                onChange={e => setNewStudent({...newStudent, access_code: e.target.value.toUpperCase()})} 
                            />
                            <button 
                                type="button" 
                                onClick={generateAccessCode}
                                className="absolute right-2 top-2 p-1.5 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 text-xs font-bold flex items-center gap-1"
                            >
                                <Key size={14}/> Avto-Yarat
                            </button>
                        </div>

                        <button type="submit" className={`w-full text-white py-3 rounded-xl font-bold transition ${editingId ? "bg-orange-500" : "bg-blue-600"}`}>{editingId ? "Yadda Saxla" : "Əlavə Et"}</button>
                    </form>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 flex flex-col h-full overflow-hidden">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <h3 className="text-lg font-bold flex items-center gap-2">Şagirdlər <span className="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{filteredStudents.length}</span></h3>
                        
                        <div className="flex items-center gap-2">
                            {/* 🔥 AXTARIŞ INPUTU */}
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input 
                                    placeholder="Ad, soyad və ya kod..." 
                                    className="pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm outline-none w-48 focus:w-64 transition-all"
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                />
                            </div>

                            {selectedIds.length > 0 && (
                                <button onClick={bulkDelete} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition animate-in fade-in text-sm">
                                    <Trash2 size={16} /> Sil ({selectedIds.length})
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-auto flex-1 rounded-lg border dark:border-gray-700">
                        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white font-bold sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-3 w-10 border-b dark:border-gray-600">
                                        <button onClick={toggleSelectAll} className="text-gray-500 hover:text-blue-600">
                                            {selectedIds.length === filteredStudents.length && filteredStudents.length > 0 ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20}/>}
                                        </button>
                                    </th>
                                    <th className="p-3 border-b dark:border-gray-600">ID</th>
                                    <th className="p-3 border-b dark:border-gray-600">Kod</th>
                                    <th className="p-3 border-b dark:border-gray-600">Ad Soyad</th>
                                    <th className="p-3 border-b dark:border-gray-600">Ata adı</th>
                                    <th className="p-3 border-b dark:border-gray-600">Sinif</th>
                                    <th className="p-3 border-b dark:border-gray-600">Sektor</th>
                                    {/* 🔥 YENİ: Müəllim / Qrup Sütunu */}
                                    <th className="p-3 border-b dark:border-gray-600">Müəllim / Qrup</th>
                                    <th className="p-3 border-b dark:border-gray-600 text-right">Əməliyyatlar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredStudents.map((s) => (
                                    <tr key={s.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition ${selectedIds.includes(s.id) ? "bg-blue-50 dark:bg-blue-900/30" : ""} ${editingId === s.id ? "bg-yellow-50 dark:bg-yellow-900/30" : ""}`}>
                                        <td className="p-3">
                                            <button onClick={() => toggleSelectOne(s.id)} className="text-gray-400 hover:text-blue-600">
                                                {selectedIds.includes(s.id) ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20}/>}
                                            </button>
                                        </td>
                                        <td className="p-3 font-mono text-blue-600 font-bold">#{s.student_code}</td>
                                        <td className="p-3 font-mono text-gray-500 text-xs">{s.access_code || "-"}</td>
                                        <td className="p-3 font-medium text-gray-800 dark:text-white">{s.first_name} {s.last_name}</td>
                                        <td className="p-3 text-gray-500">{s.father_name || "-"}</td>
                                        <td className="p-3">{s.grade}</td>
                                        <td className="p-3"><span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-600">{s.sector || "Az"}</span></td>
                                        <td className="p-3">
                                            <div className="flex flex-col">
                                                {s.teacher_name ? (
                                                    <span className="font-bold text-sm text-gray-800 dark:text-white">{s.teacher_name}</span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic">Təyin edilməyib</span>
                                                )}
                                                {s.group_name && (
                                                    <span className="mt-1 w-fit px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">{s.group_name}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 flex justify-end gap-2">
                                            <button onClick={() => startEdit(s)} className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900"><Pencil size={16}/></button>
                                            <button onClick={() => deleteStudent(s.id)} className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="text-center p-8 text-gray-400">Heç bir şagird tapılmadı.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* --- 🔥 YENİ: MY STUDENTS TAB (MƏNİM ŞAGİRDLƏRİM) --- */}
        {activeTab === 'my_students' && (
            <div className="animate-in fade-in max-w-7xl mx-auto h-full w-full overflow-hidden pb-2">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 flex flex-col h-full">
                    
                    {/* Başlıq və Axtarış */}
                    <div className="flex justify-between items-center mb-6 shrink-0">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-600">
                            <UserCheck size={24}/> Mənim Şagirdlərim 
                            <span className="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{filteredMyStudents.length}</span>
                        </h3>
                        
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input 
                                    placeholder="Ad, soyad və ya kod..." 
                                    className="pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm outline-none w-64 focus:w-80 transition-all"
                                    value={myStudentSearch}
                                    onChange={(e) => setMyStudentSearch(e.target.value)}
                                />
                            </div>

                            {selectedIds.length > 0 && (
                                <button onClick={bulkDelete} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition animate-in fade-in text-sm">
                                    <Trash2 size={16} /> Sil ({selectedIds.length})
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Cədvəl */}
                    <div className="overflow-auto flex-1 rounded-lg border dark:border-gray-700">
                        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                            <thead className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100 font-bold sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-3 w-10 border-b dark:border-gray-600">
                                        <button onClick={toggleSelectAllMyStudents} className="text-indigo-400 hover:text-indigo-600">
                                            {selectedIds.length === filteredMyStudents.length && filteredMyStudents.length > 0 ? <CheckSquare size={20} className="text-indigo-600"/> : <Square size={20}/>}
                                        </button>
                                    </th>
                                    <th className="p-3 border-b dark:border-gray-600">ID</th>
                                    <th className="p-3 border-b dark:border-gray-600">Kod</th>
                                    <th className="p-3 border-b dark:border-gray-600">Ad Soyad</th>
                                    <th className="p-3 border-b dark:border-gray-600">Ata adı</th>
                                    <th className="p-3 border-b dark:border-gray-600">Sinif</th>
                                    <th className="p-3 border-b dark:border-gray-600">Sektor</th>
                                    <th className="p-3 border-b dark:border-gray-600 text-right">Əməliyyatlar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredMyStudents.map((s) => (
                                    <tr key={s.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition ${selectedIds.includes(s.id) ? "bg-indigo-50 dark:bg-indigo-900/30" : ""}`}>
                                        <td className="p-3">
                                            <button onClick={() => toggleSelectMyStudent(s.id)} className="text-gray-400 hover:text-indigo-600">
                                                {selectedIds.includes(s.id) ? <CheckSquare size={20} className="text-indigo-600"/> : <Square size={20}/>}
                                            </button>
                                        </td>
                                        <td className="p-3 font-mono text-indigo-600 font-bold">#{s.student_code}</td>
                                        <td className="p-3 font-mono text-gray-500 text-xs">{s.access_code || "-"}</td>
                                        <td className="p-3 font-medium text-gray-800 dark:text-white">{s.first_name} {s.last_name}</td>
                                        <td className="p-3 text-gray-500">{s.father_name || "-"}</td>
                                        <td className="p-3">{s.grade}</td>
                                        <td className="p-3"><span className="px-2 py-1 rounded text-xs font-bold bg-indigo-100 text-indigo-600">{s.sector || "Az"}</span></td>
                                        <td className="p-3 flex justify-end gap-2">
                                            {/* Redaktə düyməsi əsas səhifədəki formanı aça bilər və ya modal */}
                                            <button onClick={() => { setActiveTab('students'); startEdit(s); }} className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900" title="Redaktə et"><Pencil size={16}/></button>
                                            <button onClick={() => deleteStudent(s.id)} className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900" title="Sil"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredMyStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="text-center p-8 text-gray-400">
                                            Sizə təhkim olunmuş şagird yoxdur.<br/>
                                            <span className="text-xs">Şagirdləri Jurnal bölməsində qrupa əlavə edərək siyahınıza sala bilərsiniz.</span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* ... (GROUPS & ANALYTICS eyni qalır) ... */}
        {activeTab === 'groups' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in max-w-7xl mx-auto h-full overflow-y-auto pb-20">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
                        <h3 className="text-lg font-bold mb-4">Yeni Qrup</h3>
                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <input required placeholder="Qrup Adı" className="w-full p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl outline-none" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border dark:border-gray-600">
                                <label className="text-xs font-bold text-gray-500 mb-2 block uppercase">Dərs Vaxtı Əlavə Et</label>
                                
                                <div className="flex gap-2 mb-2">
                                    <select className="p-2 border rounded-lg bg-white dark:bg-gray-600 text-sm flex-1 outline-none" value={tempDay} onChange={(e) => setTempDay(e.target.value)}>{WEEK_DAYS.map(d => <option key={d} value={d}>{d}</option>)}</select>
                                    <select className="p-2 border rounded-lg bg-white dark:bg-gray-600 text-sm outline-none w-24" value={tempTime} onChange={(e) => setTempTime(e.target.value)}>{TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}</select>
                                    <span className="self-center font-bold text-gray-400">-</span>
                                    <select className="p-2 border rounded-lg bg-white dark:bg-gray-600 text-sm outline-none w-24" value={tempEndTime} onChange={(e) => setTempEndTime(e.target.value)}>{TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}</select>
                                    <button type="button" onClick={addScheduleSlot} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><Plus size={18}/></button>
                                </div>

                                <div className="space-y-1 mt-2">
                                    {scheduleSlots.map((slot, index) => (
                                        <div key={index} className="flex justify-between items-center bg-white dark:bg-gray-600 border p-2 rounded-lg text-sm">
                                            <span className="font-bold text-gray-700 dark:text-gray-200">{slot.day} - {slot.time}</span>
                                            <button type="button" onClick={() => removeSlot(index)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Yarat</button>
                        </form>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
                        <h3 className="text-lg font-bold mb-4">Qruplarım</h3>
                        <div className="space-y-2">
                            {groups.map((g) => (
                                <div key={g.id} onClick={() => openGroup(g)} className={`p-4 rounded-xl border dark:border-gray-600 cursor-pointer flex justify-between items-center ${selectedGroup?.id === g.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                    <div><h4 className="font-bold">{g.name}</h4><p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">{g.schedule}</p></div>
                                    <ChevronRight size={18} className="text-gray-400"/>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border dark:border-gray-700 min-h-[500px]">
                    {selectedGroup ? (
                        <div>
                            <div className="flex justify-between items-center mb-6 pb-6 border-b dark:border-gray-600">
                                <div><h2 className="text-2xl font-bold">{selectedGroup.name}</h2><p className="text-gray-500 text-sm mt-1">{selectedGroup.schedule}</p></div>
                                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                                    {/* 🔥 YENİ: Axtarış Qutusu (Jurnalda əlavə etmək üçün) */}
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
                                        <input 
                                            placeholder="Axtar..."
                                            className="pl-8 p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-sm outline-none w-32 focus:w-48 transition-all"
                                            value={studentAddSearch}
                                            onChange={(e) => setStudentAddSearch(e.target.value)}
                                        />
                                    </div>
                                    <select className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-sm outline-none max-w-[200px]" value={studentToAdd} onChange={(e) => setStudentToAdd(e.target.value)}>
                                            <option value="">Şagird seç...</option>
                                            {students
                                                .filter(s => `${s.first_name} ${s.last_name} ${s.student_code}`.toLowerCase().includes(studentAddSearch.toLowerCase()))
                                                .map(s => <option key={s.id} value={s.id}>#{s.student_code} - {s.first_name} {s.last_name}</option>)
                                            }
                                    </select>
                                    <button onClick={addStudentToGroup} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap">Əlavə Et</button>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mb-4 flex-wrap">
                                <h3 className="text-lg font-bold">Jurnal</h3>
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                                    <Calendar size={18} className="text-gray-500"/>
                                    <input type="date" value={gradingDate} onChange={e => setGradingDate(e.target.value)} className="bg-transparent outline-none text-sm font-medium"/>
                                </div>
                                {!isValidDay && (
                                    <div className="flex items-center gap-2 text-orange-600 text-sm font-bold bg-orange-50 px-4 py-2 rounded-xl border border-orange-200 animate-pulse">
                                        <AlertTriangle size={18}/> 
                                        Bu gün ({new Date(gradingDate).toLocaleDateString('az-AZ', {weekday: 'long'})}) dərs yoxdur!
                                    </div>
                                )}
                                {isValidDay && (
                                    <button onClick={saveGrades} className="ml-auto bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition">
                                        <Save size={18}/> Yadda Saxla
                                    </button>
                                )}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-b dark:border-gray-600">
                                                <th className="p-3 border dark:border-gray-600">#</th><th className="p-3 border dark:border-gray-600 w-1/3">Şagird</th><th className="p-3 border dark:border-gray-600 text-center">İştirak</th><th className="p-3 border dark:border-gray-600 text-center">Bal (0-10)</th>
                                            </tr>
                                    </thead>
                                    <tbody>
                                        {groupStudents.map((s, index) => (
                                            <tr key={s.id} className={`border-b dark:border-gray-600 ${!isValidDay ? 'opacity-50 bg-gray-50 dark:bg-gray-800' : ''}`}>
                                                <td className="p-3 border dark:border-gray-600 text-gray-500">{index + 1}</td>
                                                <td className="p-3 border dark:border-gray-600 font-medium">
                                                    {s.first_name} {s.last_name}
                                                </td>
                                                
                                                {/* DAVAMİYYƏT (Button) */}
                                                <td className="p-3 border dark:border-gray-600 text-center">
                                                    <button 
                                                        onClick={() => toggleAttendance(s.id)} 
                                                        disabled={!isValidDay} // 🔥 Dərs günü deyilsə, basmaq olmasın
                                                        className={`transition ${!isValidDay ? 'cursor-not-allowed' : 'hover:scale-110'}`}
                                                    >
                                                        {attendance[s.id] !== false ? 
                                                            <CheckCircle className={isValidDay ? "text-green-500" : "text-gray-400"} size={24} /> : 
                                                            <XCircle className={isValidDay ? "text-red-500" : "text-gray-400"} size={24} />
                                                        }
                                                    </button>
                                                </td>

                                                {/* QİYMƏT (Input) */}
                                                <td className="p-3 border dark:border-gray-600">
                                                    <input 
                                                        type="number" min="0" max="10" placeholder="-" 
                                                        disabled={!isValidDay} // 🔥 Dərs günü deyilsə, yazmaq olmasın
                                                        className={`w-full p-2 rounded-md outline-none text-center font-bold 
                                                            ${!isValidDay 
                                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                                                : 'bg-blue-50/50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 focus:ring-2 focus:ring-blue-400'
                                                            }`}
                                                        value={grades[s.id] || ""} 
                                                        onChange={(e) => { 
                                                            let val = e.target.value; 
                                                            if(Number(val) > 10) val = "10"; 
                                                            setGrades({...grades, [s.id]: val}); 
                                                        }} 
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400"><BookOpen size={48} className="mb-4 opacity-20"/><p>Soldan bir qrup seçin.</p></div>
                    )}
                </div>
            </div>
        )}

        {/* --- ANALYTICS TAB --- */}
        {activeTab === 'analytics' && (
             <div className="animate-in fade-in space-y-6 pb-20 overflow-y-auto">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="w-full md:w-1/3">
                        <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                            <BarChart3 className="text-blue-600"/> Statistika
                        </h2>
                        <p className="text-gray-500 text-sm mb-3">Qrup və ya fərdi inkişaf analizləri</p>
                        <select 
                            className="p-3 border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 w-full outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                            onChange={(e) => calculateAnalytics(e.target.value)}
                            value={analyticsGroupId}
                        >
                            <option value="">Analiz üçün qrup seçin...</option>
                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                    
                    {analyticsGroupId && (
                        <div className="flex flex-col gap-3 w-full md:w-auto items-end">
                             <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                                <button onClick={() => setAnalysisMode('group')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${analysisMode === 'group' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>Qrup</button>
                                <button onClick={() => setAnalysisMode('individual')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${analysisMode === 'individual' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>Fərdi</button>
                            </div>

                            <div className="flex gap-2 w-full md:w-auto">
                                {analysisMode === 'individual' && (
                                    <select className="p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm outline-none w-full md:w-48" value={selectedStudentForChart} onChange={(e) => setSelectedStudentForChart(e.target.value)}>
                                            <option value="">Şagird seç...</option>
                                            {analyticsStudentsList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                                    </select>
                                )}
                                <select 
                                    className="p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm outline-none font-medium"
                                    value={chartInterval}
                                    onChange={(e) => setChartInterval(e.target.value as any)}
                                >
                                    <option value="lessons4">Son 4 Dərs</option>
                                    <option value="weeks4">Son 4 Həftə</option>
                                    <option value="months4">Son 4 Ay</option>
                                    <option value="year">İllik</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {analyticsGroupId ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 relative overflow-hidden group hover:shadow-md transition">
                                <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -mr-8 -mt-8 transition group-hover:scale-110"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">{displayStats.title} Bal</p>
                                            <h3 className="text-4xl font-extrabold text-gray-800 dark:text-white mt-2">{displayStats.score}</h3>
                                        </div>
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900 text-blue-600 rounded-xl">
                                            <Activity size={24}/>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(Number(displayStats.score) / 10) * 100}%` }}></div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 text-right">Maksimum: 10</p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 relative overflow-hidden group hover:shadow-md transition">
                                <div className="absolute right-0 top-0 w-32 h-32 bg-green-50 dark:bg-green-900/20 rounded-bl-full -mr-8 -mt-8 transition group-hover:scale-110"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">{displayStats.title} Davamiyyət</p>
                                            <h3 className="text-4xl font-extrabold text-gray-800 dark:text-white mt-2">{displayStats.attendance}%</h3>
                                        </div>
                                        <div className="p-3 bg-green-100 dark:bg-green-900 text-green-600 rounded-xl">
                                            <CheckCircle size={24}/>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                        <div className="bg-green-500 h-full rounded-full" style={{ width: `${displayStats.attendance}%` }}></div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 text-right">Hədəf: 100%</p>
                                </div>
                            </div>
                        </div>

                        {chartData.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
                                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                        <BarChart3 size={20} className="text-purple-500"/> Müqayisəli Nəticələr
                                    </h3>
                                    <div className="h-72 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} domain={[0, 10]} />
                                                <Tooltip 
                                                    cursor={{fill: 'transparent'}}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                                />
                                                <Bar dataKey="avg" name="Ortalama Bal" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
                                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                        <TrendingUp size={20} className="text-blue-500"/> İnkişaf Dinamikası
                                    </h3>
                                    <div className="h-72 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} domain={[0, 10]} />
                                                <Tooltip 
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="avg" 
                                                    name="Ortalama Bal"
                                                    stroke="#3b82f6" 
                                                    strokeWidth={4}
                                                    dot={{ fill: '#fff', stroke: '#3b82f6', strokeWidth: 2, r: 4 }}
                                                    activeDot={{ r: 6, fill: '#3b82f6' }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}

                        {analysisMode === 'group' && (
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 overflow-hidden">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Users size={20} className="text-orange-500"/> Şagird Reytinqi
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b-2 border-gray-100 dark:border-gray-700 text-gray-400 uppercase text-xs">
                                                <th className="p-3 font-bold">Reytinq</th>
                                                <th className="p-3 font-bold">Şagird</th>
                                                <th className="p-3 font-bold">Ortalama</th>
                                                <th className="p-3 font-bold">Davamiyyət</th>
                                                <th className="p-3 font-bold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {analyticsData.map((s, index) => (
                                                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition group">
                                                    <td className="p-4">
                                                        <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs 
                                                            ${index === 0 ? 'bg-yellow-100 text-yellow-600' : 
                                                              index === 1 ? 'bg-gray-100 text-gray-600' : 
                                                              index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-transparent text-gray-400'}`}>
                                                            {index + 1}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 font-semibold text-gray-700 dark:text-gray-200">{s.first_name} {s.last_name}</td>
                                                    <td className="p-4">
                                                        <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{s.avgScore}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full ${parseFloat(s.attendanceRate) > 85 ? 'bg-green-500' : parseFloat(s.attendanceRate) > 50 ? 'bg-orange-400' : 'bg-red-500'}`} style={{ width: `${s.attendanceRate}%` }}></div>
                                                            </div>
                                                            <span className="text-xs font-medium text-gray-500">{s.attendanceRate}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        {parseFloat(s.avgScore) >= 9 ? 
                                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-600 border border-purple-200">💎 Əlaçı</span> :
                                                        parseFloat(s.avgScore) >= 7 ? 
                                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600 border border-green-200">🚀 Yaxşı</span> :
                                                        parseFloat(s.avgScore) >= 5 ? 
                                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-600 border border-orange-200">⚡ Orta</span> :
                                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200">⚠️ Zəif</span>
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
                            <BarChart3 size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Analizə Başlamaq Üçün</h3>
                        <p className="text-gray-500 max-w-sm">Zəhmət olmasa yuxarıdakı menyudan analiz etmək istədiyiniz <strong>Qrupu</strong> seçin.</p>
                    </div>
                )}
             </div>
        )}

      </main>
    </div>
  );
}
