import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'ไม่พบไฟล์รูปภาพ' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';

    const prompt = `
      วิเคราะห์ภาพขยะนี้อย่างละเอียด และตอบกลับเป็น JSON ภาษาไทยเท่านั้นในรูปแบบต่อไปนี้ (ห้ามใส่คำเกริ่น ห้ามใส่ markdown code block หรือคำอื่นเด็ดขาด):
      {
        "item_name": "ชื่อขยะภาษาไทย",
        "waste_type": "ประเภทขยะ (ขยะรีไซเคิล / ขยะทั่วไป / ขยะอันตราย / ขยะอินทรีย์)",
        "bin_color": "สีถังขยะที่ต้องทิ้ง (เหลือง / น้ำเงิน / แดง / เขียว)",
        "est_weight_g": 35,
        "carbon_saved_kg": 0.085,
        "est_value_thb": 0.50,
        "disposal_guide": "ข้อแนะนำสั้นๆ ในการจัดเตรียมขยะก่อนทิ้ง"
      }
    `;

    // เรียกใช้ Groq Vision API แบบกำหนด max_tokens ป้องกัน Token Limit Exceeded
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.2-11b-vision-instruct',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      })
    });

    const groqData = await groqRes.json();

    if (!groqRes.ok) {
      throw new Error(groqData.error?.message || 'เกิดข้อผิดพลาดจาก Groq API');
    }

    const responseText = groqData.choices[0].message.content;
    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanedText);

    // บันทึกลง Supabase
    const { error: dbError } = await supabase.from('waste_logs').insert([
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

    if (dbError) {
      console.error('Supabase Insert Error:', dbError);
      throw new Error(`บันทึกฐานข้อมูลไม่สำเร็จ: ${dbError.message}`);
    }

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error('API Scan Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
