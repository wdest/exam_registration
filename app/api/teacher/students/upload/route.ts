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
  try {
    const user = JSON.parse(token);
    if (user.role !== 'teacher') return null;
    return user;
  } catch { return null; }
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const body = await request.json();
    const { students } = body;

    if (!students || !Array.isArray(students)) {
        return NextResponse.json({ error: "Yanlış data formatı" }, { status: 400 });
    }

    const formattedStudents = students.map((row: any) => {
        // 1. Soyad və Ata adını ayırmaq
        // Format: "Last Name" sütununda -> "Ibrahimova Haci"
        let lastName = row['Last Name'] || "";
        let fatherName = "";

        if (lastName.includes(" ")) {
            const parts = lastName.trim().split(" ");
            lastName = parts[0]; // "Ibrahimova"
            fatherName = parts.slice(1).join(" "); // "Haci"
        }

        // 2. Sektoru təyin etmək
        // "External ID": "BO (Az)" -> "Az", "BO (Ru)" -> "Ru"
        let sector = "Az";
        const extId = row['External ID'] || "";
        if (extId.includes("Ru")) sector = "Ru";
        else if (extId.includes("Eng") || extId.includes("En")) sector = "Eng";

        // 3. Digər sahələr
        return {
            teacher_id: user.id,
            student_code: row['ZipGrade ID'] ? String(row['ZipGrade ID']) : null, // ID
            first_name: row['First Name'],
            last_name: lastName,
            father_name: fatherName,
            sector: sector,
            grade: row['Classes'] ? String(row['Classes']) : "", // Sinif
            access_code: row['Access Code'] || null, // Kod
            school: "", // Manual doldurulacaq
            phone: "",  // Manual doldurulacaq
            // Əgər start_date yoxdursa, bu günü yaz
            start_date: new Date().toISOString().split('T')[0]
        };
    });

    // Bazaya Upsert (Varsa yenilə, yoxsa yarat)
    const { error } = await supabaseAdmin
        .from('local_students')
        .upsert(formattedStudents, { 
            onConflict: 'student_code', // ZipGrade ID unikaldır
            ignoreDuplicates: false 
        });

    if (error) {
        console.error("Upload error:", error);
        throw error;
    }

    return NextResponse.json({ success: true, count: formattedStudents.length });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
