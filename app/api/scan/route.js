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

    // ใช้ชื่อโมเดล Vision ของ Groq ที่ถูกต้องในปัจจุบัน
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

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error('API Scan Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
