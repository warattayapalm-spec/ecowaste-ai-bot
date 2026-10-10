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
      วิเคราะห์ภาพขยะนี้อย่างละเอียด และตอบกลับเป็น JSON เท่านั้นในรูปแบบต่อไปนี้ (ห้ามใส่คำเกริ่น ห้ามใส่ markdown code block หรือคำอื่นเด็ดขาด):
      {
        "item_name": "ชื่อขยะภาษาไทยอย่างเป็นทางการ",
        "waste_type": "ประเภทขยะ (ขยะรีไซเคิล / ขยะทั่วไป / ขยะอันตราย / ขยะอินทรีย์)",
        "bin_color": "สีถังขยะที่ต้องทิ้ง (เหลือง / น้ำเงิน / แดง / เขียว)",
        "est_weight_g": 35,
        "carbon_saved_kg": 0.085,
        "est_value_thb": 0.50,
        "disposal_guide": "ข้อแนะนำสั้นๆ ในการจัดเตรียมขยะก่อนทิ้ง"
      }
    `;

    // รายชื่อโมเดลที่รองรับ Free Tier API Key ในปัจจุบัน
    const modelCandidates = [
      'gemini-2.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-2.0-flash'
    ];

    let responseText = null;
    let lastError = null;

    for (const modelName of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const res = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Image,
              mimeType: file.type || 'image/jpeg'
            }
          }
        ]);
        
        const candidateText = res.response.text();
        if (candidateText && candidateText.trim().length > 0) {
          responseText = candidateText;
          break; // เมื่อพบโมเดลที่ใช้งานได้ ให้หยุดวนลูปทันที
        }
      } catch (err) {
        lastError = err;
        console.warn(`Model candidate [${modelName}] failed, trying next...`, err.message);
      }
    }

    if (!responseText) {
      throw new Error(lastError ? `[AI Service Error]: ${lastError.message}` : 'ไม่สามารถดึงข้อมูลจาก AI Model ได้');
    }

    // ทำความสะอาด JSON Response (ตัด markdown code blocks ออก)
    const cleanedText = responseText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const result = JSON.parse(cleanedText);

    // บันทึกลง Supabase
    await supabase.from('waste_logs').insert([
      {
        telegram_user_id: 'web_user',
        telegram_username: 'Web User',
        item_name: result.item_name || 'ขยะไม่ระบุชื่อ',
        waste_type: result.waste_type || 'ขยะทั่วไป',
        bin_color: result.bin_color || 'น้ำเงิน',
        est_weight_g: Number(result.est_weight_g) || 0,
        carbon_saved_kg: Number(result.carbon_saved_kg) || 0,
        est_value_thb: Number(result.est_value_thb) || 0,
        disposal_guide: result.disposal_guide || 'ทิ้งลงถังขยะให้ถูกต้อง',
      }
    ]);

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error('API Scan Error Details:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
