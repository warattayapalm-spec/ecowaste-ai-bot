'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    const { data } = await supabase
      .from('waste_logs')
      .select('*')
      .order('created_at', { ascending: false });
    setLogs(data || []);
    setLoading(false);
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // แสดงรูปพรีวิว
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // ส่งรูปไปวิเคราะห์ที่ API
    setAnalyzing(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.result);
        fetchLogs(); // อัปเดตตารางสถิติใหม่
      } else {
        alert('เกิดข้อผิดพลาดในการวิเคราะห์: ' + (data.error || 'โปรดลองอีกครั้ง'));
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setAnalyzing(false);
    }
  };

  const totalCarbon = logs.reduce((acc, cur) => acc + Number(cur.carbon_saved_kg || 0), 0);
  const totalValue = logs.reduce((acc, cur) => acc + Number(cur.est_value_thb || 0), 0);

  return (
    <main style={{ padding: '1.5rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: '#2e7d32', marginBottom: '0.5rem' }}>🌱 EcoWaste AI</h1>
        <p style={{ color: '#555', margin: 0 }}>สแกนคัดแยกขยะอัจฉริยะ ประเมินคาร์บอนและมูลค่าทันที</p>
      </header>

      {/* ส่วนเปิดกล้อง/อัปโหลดรูปภาพ */}
      <section style={{ background: '#fff', border: '2px dashed #4caf50', borderRadius: '16px', padding: '2rem', textAlign: 'center', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
        />

        {preview && (
          <img src={preview} alt="Preview" style={{ maxHeight: '250px', borderRadius: '12px', marginBottom: '1rem', objectFit: 'contain' }} />
        )}

        <div>
          <button 
            onClick={() => fileInputRef.current.click()} 
            disabled={analyzing}
            style={{
              backgroundColor: '#2e7d32',
              color: 'white',
              padding: '14px 28px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(46,125,50,0.3)'
            }}
          >
            {analyzing ? '⏳ กำลังวิเคราะห์รูปภาพ...' : '📸 ถ่ายรูป / เลือกรูปขยะ'}
          </button>
        </div>

        {/* แสดงผลการวิเคราะห์ */}
        {result && (
          <div style={{ marginTop: '1.5rem', textAlign: 'left', background: '#f1f8e9', padding: '1.2rem', borderRadius: '12px', border: '1px solid #c8e6c9' }}>
            <h3 style={{ color: '#2e7d32', marginTop: 0 }}>✨ ผลการวิเคราะห์ขยะ</h3>
            <p><strong>📦 รายการ:</strong> {result.item_name}</p>
            <p><strong>🏷️ หมวดหมู่:</strong> {result.waste_type}</p>
            <p><strong>🗑️ ถังขยะที่ต้องทิ้ง:</strong> ถังสี{result.bin_color}</p>
            <p><strong>🍃 ปริมาณคาร์บอนที่ลดได้:</strong> +{result.carbon_saved_kg} kgCO2e</p>
            <p><strong>💰 มูลค่าประเมิน:</strong> +{result.est_value_thb} บาท</p>
            <p><strong>💡 วิธีจัดเตรียมก่อนทิ้ง:</strong> {result.disposal_guide}</p>
          </div>
        )}
      </section>

      {/* บล็อกแสดงสถิติรวม */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: '#e8f5e9', padding: '1.2rem', borderRadius: '12px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: '#555' }}>📦 ขยะที่สแกนทั้งหมด</span>
          <h2 style={{ margin: '0.5rem 0 0', color: '#2e7d32' }}>{logs.length} ชิ้น</h2>
        </div>
        <div style={{ background: '#e3f2fd', padding: '1.2rem', borderRadius: '12px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: '#555' }}>🍃 ลดคาร์บอนรวม</span>
          <h2 style={{ margin: '0.5rem 0 0', color: '#1565c0' }}>{totalCarbon.toFixed(3)} kgCO2e</h2>
        </div>
        <div style={{ background: '#fff8e1', padding: '1.2rem', borderRadius: '12px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: '#555' }}>💰 มูลค่ารวมประเมิน</span>
          <h2 style={{ margin: '0.5rem 0 0', color: '#f57f17' }}>{totalValue.toFixed(2)} ฿</h2>
        </div>
      </div>

      {/* ตารางแสดงประวัติ */}
      <h2>📋 ประวัติการสแกนล่าสุด</h2>
      {loading ? <p>กำลังโหลดข้อมูล...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>เวลา</th>
                <th style={{ padding: '12px' }}>รายการขยะ</th>
                <th style={{ padding: '12px' }}>ประเภท</th>
                <th style={{ padding: '12px' }}>คาร์บอน (kg)</th>
                <th style={{ padding: '12px' }}>มูลค่า (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: '#666' }}>{new Date(log.created_at).toLocaleString('th-TH')}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{log.item_name}</td>
                  <td style={{ padding: '12px' }}>{log.waste_type}</td>
                  <td style={{ padding: '12px', color: '#2e7d32' }}>{log.carbon_saved_kg}</td>
                  <td style={{ padding: '12px', color: '#f57f17' }}>{log.est_value_thb}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
