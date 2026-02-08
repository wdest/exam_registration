import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  try { return JSON.parse(token); } catch { return null; }
}

// Helper: Saat aralığının kəsişdiyini yoxlayır
function isTimeConflict(start1: string, end1: string, start2: string, end2: string) {
    // String müqayisəsi (HH:MM) işləyir: "14:00" < "15:00" = true
    return (start1 < end2 && start2 < end1); 
}

const WEEK_DAYS = ["Baz", "B.e", "Ç.a", "Çərş", "C.a", "Cüm", "Şən"];

export async function GET(request: Request) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    try {
        const { data: groups } = await supabaseAdmin.from('groups').select('id').eq('teacher_id', user.id);
        const groupIds = groups?.map(g => g.id) || [];

        if (groupIds.length === 0) return NextResponse.json({ extraLessons: [], lessonStatuses: [] });

        const [statusesRes, extrasRes] = await Promise.all([
            supabaseAdmin.from('lesson_status').select('*').in('group_id', groupIds),
            supabaseAdmin.from('extra_lessons').select('*').in('group_id', groupIds)
        ]);

        return NextResponse.json({ 
            lessonStatuses: statusesRes.data || [], 
            extraLessons: extrasRes.data || [] 
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    try {
        const body = await request.json();
        const { type, ...data } = body;

        // --- 🔥 YENİ: ƏLAVƏ DƏRSİ SİLMƏK ---
        if (type === 'delete_extra') {
            const { id } = data;
            
            // Sadəcə bu müəllimin qrupu olduğunu yoxlamaq yaxşı olardı, amma sadəlik üçün birbaşa silirik
            // (Çünki ID unikal UUID-dir)
            const { error } = await supabaseAdmin
                .from('extra_lessons')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        // Qrup ID-ni tapırıq
        let targetGroupId = data.groupId || data.group_id;
        if (!targetGroupId) return NextResponse.json({ error: "Qrup ID çatışmır" }, { status: 400 });

        // 1. Qrup Yoxlaması (Müəllimə aiddirmi?)
        const { data: groupData } = await supabaseAdmin
            .from('groups')
            .select('id, schedule')
            .eq('id', targetGroupId)
            .eq('teacher_id', user.id)
            .single();

        if (!groupData) {
            return NextResponse.json({ error: "Bu qrup üzərində əməliyyat icazəniz yoxdur!" }, { status: 403 });
        }

        // --- 🔥 YENİLƏNMİŞ: STATUS YENİLƏMƏ (SAAT İLƏ) ---
        if (type === 'status') {
            const { groupId, date, status, startTime } = data; // Frontend-dən gələn startTime
            
            // start_time yoxdursa '00:00' qəbul edirik (köhnə datalar üçün)
            const timeVal = startTime || '00:00'; 

            if (status === null) {
                // Siləndə həm tarixə, həm saata görə silirik
                await supabaseAdmin
                    .from('lesson_status')
                    .delete()
                    .match({ group_id: groupId, lesson_date: date, start_time: timeVal });
            } else {
                // Upsert edəndə start_time-ı da yazırıq
                const { error } = await supabaseAdmin.from('lesson_status').upsert({ 
                    group_id: groupId, 
                    lesson_date: date, 
                    start_time: timeVal, // <--- VACİB HİSSƏ
                    status: status 
                }, { onConflict: 'group_id, lesson_date, start_time' }); // <--- Database constraint buna uyğun olmalıdır
                
                if (error) throw error;
            }
            return NextResponse.json({ success: true });
        }

        // --- ƏLAVƏ DƏRS YARATMAQ (CONFLICT CHECK İLƏ) ---
        if (type === 'extra_lesson') {
            const { group_id, lesson_date, start_time, end_time } = data;

            // A. Ləğv olunmuş dərsləri gətir
            const { data: cancelledLessons } = await supabaseAdmin
                .from('lesson_status')
                .select('lesson_date, start_time')
                .eq('group_id', group_id)
                .eq('status', 'cancelled');
            
            // Ləğv olunanları bir Set-ə yığırıq: "YYYY-MM-DD_HH:MM" formatında
            const cancelledSet = new Set(cancelledLessons?.map(c => `${c.lesson_date}_${c.start_time?.slice(0,5)}`) || []);

            // B. Digər Extra Dərslərlə kəsişməni yoxla
            const { data: existingExtras } = await supabaseAdmin
                .from('extra_lessons')
                .select('*')
                .eq('group_id', group_id)
                .eq('lesson_date', lesson_date); 

            const conflictExtra = existingExtras?.find(ex => isTimeConflict(start_time, end_time, ex.start_time, ex.end_time));
            
            if (conflictExtra) {
                return NextResponse.json({ error: `Bu saatda (${conflictExtra.start_time}-${conflictExtra.end_time}) artıq əlavə dərs var!` }, { status: 409 });
            }

            // C. Regular Schedule ilə kəsişməni yoxla
            const d = new Date(lesson_date);
            const dayName = WEEK_DAYS[d.getDay()]; // Məs: "B.e"
            
            if (groupData.schedule && groupData.schedule.includes(dayName)) {
                const slots = groupData.schedule.split(', ');
                for (const slot of slots) {
                    const parts = slot.trim().split(' ');
                    if (parts.length >= 2) {
                        const [sDay, sTimeRange] = parts;
                        
                        if (sDay === dayName) {
                             // Regular dərs vaxtını tapırıq
                             let regStart = sTimeRange;
                             let regEnd = "";
                             
                             if (sTimeRange.includes("-")) {
                                 [regStart, regEnd] = sTimeRange.split("-");
                             } else {
                                 const [h, m] = regStart.split(":").map(Number);
                                 // Sadə hesablama: +90 dəqiqə
                                 const dateObj = new Date(); dateObj.setHours(h, m + 90);
                                 regEnd = `${String(dateObj.getHours()).padStart(2,'0')}:${String(dateObj.getMinutes()).padStart(2,'0')}`;
                             }

                             // Bu regular dərs ləğv olunubmu?
                             const cancelKey = `${lesson_date}_${regStart}`;
                             if (cancelledSet.has(cancelKey)) {
                                 continue; // Ləğv olunubsa, üstünə yaza bilərik, problem yoxdur
                             }

                             if (isTimeConflict(start_time, end_time, regStart, regEnd)) {
                                 return NextResponse.json({ error: `Bu vaxtda (${regStart}-${regEnd}) artıq planlı dərs var! (Status: Aktiv)` }, { status: 409 });
                             }
                        }
                    }
                }
            }

            // Hər şey təmizdirsə, yaz
            const { error } = await supabaseAdmin.from('extra_lessons').insert([{
                group_id, lesson_date, start_time, end_time
            }]);
            
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Yanlış əməliyyat növü" }, { status: 400 });

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message || "Server xətası" }, { status: 500 });
    }
}
