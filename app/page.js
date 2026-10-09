'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      const { data } = await supabase
        .from('waste_logs')
        .select('*')
        .order('created_at', { ascending: false });
      setLogs(data || []);
      setLoading(false);
    }
    fetchLogs();
  }, []);

  const totalCarbon = logs.reduce((acc, cur) => acc + Number(cur.carbon_saved_kg || 0), 0);
  const totalValue = logs.reduce((acc, cur) => acc + Number(cur.est_value_thb || 0), 0);

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <h1>🌱 EcoWaste AI — Web Dashboard</h1>
      <p>ระบบติดตามสถิติการคัดแยกขยะและการประเมินมูลค่าสะสม</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', margin: '2rem 0' }}>
        <div style={{ background: '#e6f4ea', padding: '1.5rem', borderRadius: '8px' }}>
          <h3>📦 ขยะที่สแกนทั้งหมด</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{logs.length} ชิ้น</p>
        </div>
        <div style={{ background: '#e8f0fe', padding: '1.5rem', borderRadius: '8px' }}>
          <h3>🍃 ลดคาร์บอนรวม</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#137333' }}>{totalCarbon.toFixed(3)} kgCO2e</p>
        </div>
        <div style={{ background: '#fef7e0', padding: '1.5rem', borderRadius: '8px' }}>
          <h3>💰 มูลค่าเงินบาทรวม</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#b06000' }}>{totalValue.toFixed(2)} ฿</p>
        </div>
      </div>

      <h2>📋 ประวัติการสแกนล่าสุด</h2>
      {loading ? <p>กำลังโหลดข้อมูล...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ background: '#f1f3f4', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>เวลา</th>
              <th style={{ padding: '10px' }}>ผู้ใช้งาน</th>
              <th style={{ padding: '10px' }}>รายการขยะ</th>
              <th style={{ padding: '10px' }}>ประเภท</th>
              <th style={{ padding: '10px' }}>คาร์บอน (kg)</th>
              <th style={{ padding: '10px' }}>มูลค่า (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>{new Date(log.created_at).toLocaleString('th-TH')}</td>
                <td style={{ padding: '10px' }}>{log.telegram_username}</td>
                <td style={{ padding: '10px' }}>{log.item_name}</td>
                <td style={{ padding: '10px' }}>{log.waste_type}</td>
                <td style={{ padding: '10px' }}>{log.carbon_saved_kg}</td>
                <td style={{ padding: '10px' }}>{log.est_value_thb}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
