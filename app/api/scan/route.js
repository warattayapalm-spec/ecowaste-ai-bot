import { NextResponse } from 'next/server';

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
      คุณคือระบบวิเคราะห์ประเภทขยะอัจฉริยะ โปรดสังเกตภาพอย่างละเอียด:
      1. ตรวจสอบยี่ห้อ ข้อความ ตัวหนังสือบนบรรจุภัณฑ์ (เช่น Protex = แป้งเย็น/ผลิตภัณฑ์ดูแลร่างกาย, Coke = กระป๋องน้ำอัดลม ฯลฯ)
      2. อย่าเดาวัตถุจากแค่รูปทรงหรือสี ให้ใช้ข้อความฉลากประกอบเสมอ
      
      ระบุผลลัพธ์เป็น JSON ภาษาไทยเท่านั้นในรูปแบบนี้ (ห้ามใส่ markdown code block หรือคำอื่นเด็ดขาด):
      {
        "item_name": "ชื่อวัตถุ/บรรจุภัณฑ์ภาษาไทยอย่างถูกต้อง (เช่น ขวดแป้งเย็น Protex, ขวดน้ำพลาสติก)",
        "waste_type": "ประเภทขยะ (ขยะรีไซเคิล / ขยะทั่วไป / ขยะอันตราย / ขยะอินทรีย์)",
        "bin_color": "สีถังขยะที่ต้องทิ้ง (เหลือง / น้ำเงิน / แดง / เขียว)",
        "est_weight_g": 150,
        "carbon_saved_kg": 0.05,
        "est_value_thb": 0.50,
        "disposal_guide": "วิธีจัดเตรียมขยะสั้นๆ ก่อนทิ้ง"
      }
    `;

    // เรียกใช้โมเดล Vision ของ Groq ชื่อที่ถูกต้อง
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.2-11b-vision-preview',
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
        temperature: 0.1,
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

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error('API Scan Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
