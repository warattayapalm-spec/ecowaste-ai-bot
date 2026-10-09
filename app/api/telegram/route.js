import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../../../lib/supabaseClient';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function sendTelegramMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const message = body.message;

    if (!message) return NextResponse.json({ status: 'ok' });

    const chatId = message.chat.id;
    const userId = String(message.from.id);
    const username = message.from.username || message.from.first_name || 'Anonymous';

    // คำสั่ง /start
    if (message.text === '/start') {
      await sendTelegramMessage(
        chatId,
        '🌱 *ยินดีต้อนรับสู่ EcoWaste AI!*\n\nถ่ายรูปขยะส่งมาให้ผมได้เลยครับ AI จะช่วยวิเคราะห์ประเภทขยะ วิธีแยก คาร์บอนที่ลดได้ และประเมินมูลค่าเงินบาทให้ทันที!'
      );
      return NextResponse.json({ status: 'ok' });
    }

    // คำสั่ง /stats
    if (message.text === '/stats') {
      const { data, error } = await supabase
        .from('waste_logs')
        .select('carbon_saved_kg, est_value_thb')
        .eq('telegram_user_id', userId);

      if (error || !data) {
        await sendTelegramMessage(chatId, '❌ ไม่สามารถดึงข้อมูลสถิติได้ในขณะนี้');
        return NextResponse.json({ status: 'ok' });
      }

      const totalCarbon = data.reduce((acc, cur) => acc + Number(cur.carbon_saved_kg || 0), 0);
      const totalValue = data.reduce((acc, cur) => acc + Number(cur.est_value_thb || 0), 0);

      await sendTelegramMessage(
        chatId,
        `📊 *สรุปสถิติของคุณ (${username})*\n\n` +
        `♻️ สแกนขยะไปแล้ว: *${data.length}* ชิ้น\n` +
        `🍃 ช่วยลดคาร์บอนสะสม: *${totalCarbon.toFixed(3)}* kgCO2e\n` +
        `💰 มูลค่าขยะประเมินสะสม: *${totalValue.toFixed(2)}* บาท`
      );
      return NextResponse.json({ status: 'ok' });
    }

    // กรณีส่งรูปภาพเข้ามา
    if (message.photo && message.photo.length > 0) {
      await sendTelegramMessage(chatId, '🔍 *กำลังวิเคราะห์รูปภาพขยะ... กรุณารอสักครู่*');

      const photo = message.photo[message.photo.length - 1];
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${photo.file_id}`);
      const fileData = await fileRes.json();
      const filePath = fileData.result.file_path;
      const imgUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

      const imgRes = await fetch(imgUrl);
      const arrayBuffer = await imgRes.arrayBuffer();
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
            mimeType: 'image/jpeg'
          }
        }
      ]);

      const rawText = response.response.text().replace(/```json|```/g, '').trim();
      const result = JSON.parse(rawText);

      // บันทึกลง Supabase
      await supabase.from('waste_logs').insert([
        {
          telegram_user_id: userId,
          telegram_username: username,
          item_name: result.item_name,
          waste_type: result.waste_type,
          bin_color: result.bin_color,
          est_weight_g: result.est_weight_g,
          carbon_saved_kg: result.carbon_saved_kg,
          est_value_thb: result.est_value_thb,
          disposal_guide: result.disposal_guide,
        }
      ]);

      const replyMsg = 
        `✨ *ผลการวิเคราะห์ขยะอัจฉริยะ*\n\n` +
        `📦 *รายการ:* ${result.item_name}\n` +
        `🏷️ *หมวดหมู่:* ${result.waste_type}\n` +
        `🗑️ *ทิ้งในถังสี:* ${result.bin_color}\n` +
        `⚖️ *น้ำหนักประเมิน:* ~${result.est_weight_g} กรัม\n\n` +
        `🍃 *ลดคาร์บอนได้:* +${result.carbon_saved_kg} kgCO2e\n` +
        `💰 *มูลค่าประเมิน:* +${result.est_value_thb} บาท\n\n` +
        `💡 *วิธีจัดเตรียมก่อนทิ้ง:* ${result.disposal_guide}`;

      await sendTelegramMessage(chatId, replyMsg);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
