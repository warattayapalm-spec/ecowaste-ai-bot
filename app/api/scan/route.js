import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../../../lib/supabaseClient';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'ไม่พบไฟล์รูปภาพ' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');

    const prompt = `
      วิเคราะห์ภาพขยะนี้ และตอบกลับเป็น JSON เท่านั้นในรูปแบบต่อไปนี้ (ห้ามใส่ markdown code block หรือคำอื่นเด็ดขาด):
      {
        "item_name": "ชื่อขยะภาษาไทย",
        "waste_type": "ประเภทขยะ (ขยะรีไซเคิล/ขยะทั่วไป/ขยะอันตราย/ขยะอินทรีย์)",
        "bin_color": "สีถังขยะที่ต้องทิ้ง (เหลือง/น้ำเงิน/แดง/เขียว)",
        "est_weight_g": 25,
        "carbon_saved_kg": 0.075,
        "est_value_thb": 0.30,
        "disposal_guide": "ข้อแนะนำสั้นๆ ในการจัดเตรียมก่อนทิ้ง"
      }
    `;

    // ใช้โมเดล gemini-2.5-flash ตามที่ระบบแนะนำ
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const response = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: file.type || 'image/jpeg'
        }
      }
    ]);

    const rawText = response.response.text().replace(/```json|```/g, '').trim();
    const result = JSON.parse(rawText);

    // บันทึกลง Supabase
    await supabase.from('waste_logs').insert([
      {
        telegram_user_id: 'web_user',
        telegram_username: 'Web User',
        item_name: result.item_name,
        waste_type: result.waste_type,
        bin_color: result.bin_color,
        est_weight_g: result.est_weight_g,
        carbon_saved_kg: result.carbon_saved_kg,
        est_value_thb: result.est_value_thb,
        disposal_guide: result.disposal_guide,
      }
    ]);

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
