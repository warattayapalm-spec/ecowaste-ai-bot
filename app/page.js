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

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

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
        fetchLogs();
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
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header Bar */}
      <header style={{ borderBottom: '1px solid #1e293b', backgroundColor: '#0f172a', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
              🌱
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, letterSpacing: '-0.025em', color: '#fff' }}>EcoWaste AI</h1>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Smart Waste Classification Platform</p>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', backgroundColor: '#064e3b', color: '#34d399', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontWeight: '600', border: '1px solid #059669' }}>
            ● System Active
          </span>
        </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        
        {/* Upload & Camera Section */}
        <section style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', padding: '2rem', textAlign: 'center', marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileChange}
          />

          {preview && (
            <div style={{ marginBottom: '1.5rem' }}>
              <img src={preview} alt="Preview" style={{ maxHeight: '280px', borderRadius: '12px', border: '2px solid #475569', objectFit: 'contain' }} />
            </div>
          )}

          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <button 
              onClick={() => fileInputRef.current.click()} 
              disabled={analyzing}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                color: 'white',
                padding: '1rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)',
                transition: 'all 0.2s ease'
              }}
            >
              {analyzing ? '⏳ กำลังวิเคราะห์ข้อมูล AI...' : '📸 สแกนขยะ / ถ่ายรูปภาพ'}
            </button>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.75rem', margin: '0.75rem 0 0' }}>
              รองรับไฟล์ภาพถ่ายขยะรีไซเคิล, ขยะทั่วไป, และขยะอินทรีย์
            </p>
          </div>

          {/* AI Result Cards */}
          {result && (
            <div style={{ marginTop: '2rem', textAlign: 'left', background: '#0f172a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #059669' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #1e293b', pb: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>✨</span>
                <h3 style={{ margin: 0, color: '#34d399', fontSize: '1.1rem' }}>ผลการวิเคราะห์โดย Gemini AI</h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
                <div><span style={{ color: '#94a3b8' }}>ชื่อวัตถุ:</span> <strong style={{ color: '#f8fafc' }}>{result.item_name}</strong></div>
                <div><span style={{ color: '#94a3b8' }}>ประเภท:</span> <strong style={{ color: '#38bdf8' }}>{result.waste_type}</strong></div>
                <div><span style={{ color: '#94a3b8' }}>ถังขยะที่แนะนำ:</span> <strong style={{ color: '#facc15' }}>สี{result.bin_color}</strong></div>
                <div><span style={{ color: '#94a3b8' }}>การลดคาร์บอน:</span> <strong style={{ color: '#34d399' }}>+{result.carbon_saved_kg} kgCO2e</strong></div>
                <div><span style={{ color: '#94a3b8' }}>มูลค่าประเมิน:</span> <strong style={{ color: '#f97316' }}>+{result.est_value_thb} ฿</strong></div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed #334155', fontSize: '0.875rem' }}>
                <span style={{ color: '#94a3b8' }}>💡 ข้อแนะนำการทิ้ง: </span>
                <span style={{ color: '#e2e8f0' }}>{result.disposal_guide}</span>
              </div>
            </div>
          )}
        </section>

        {/* Analytics Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '12px', border: '1px solid #334155' }}>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>ยอดรวมการสแกน</p>
            <h2 style={{ fontSize: '1.875rem', fontWeight: '700', margin: '0.25rem 0 0', color: '#f8fafc' }}>{logs.length} <span style={{ fontSize: '0.875rem', fontWeight: '400', color: '#64748b' }}>รายการ</span></h2>
          </div>
          <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '12px', border: '1px solid #334155' }}>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>ปริมาณคาร์บอนที่ลดได้รวม</p>
            <h2 style={{ fontSize: '1.875rem', fontWeight: '700', margin: '0.25rem 0 0', color: '#34d399' }}>{totalCarbon.toFixed(3)} <span style={{ fontSize: '0.875rem', fontWeight: '400', color: '#64748b' }}>kgCO2e</span></h2>
          </div>
          <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '12px', border: '1px solid #334155' }}>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>มูลค่าประเมินรวมสะสม</p>
            <h2 style={{ fontSize: '1.875rem', fontWeight: '700', margin: '0.25rem 0 0', color: '#fbbf24' }}>{totalValue.toFixed(2)} <span style={{ fontSize: '0.875rem', fontWeight: '400', color: '#64748b' }}>บาท</span></h2>
          </div>
        </div>

        {/* Data Table Section */}
        <section style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #334155' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>📋 ประวัติการประมวลผลล่าสุด</h3>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>กำลังดึงข้อมูล...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '0.875rem 1.5rem' }}>เวลา</th>
                    <th style={{ padding: '0.875rem 1.5rem' }}>รายการขยะ</th>
                    <th style={{ padding: '0.875rem 1.5rem' }}>ประเภท</th>
                    <th style={{ padding: '0.875rem 1.5rem' }}>ลดคาร์บอน</th>
                    <th style={{ padding: '0.875rem 1.5rem' }}>มูลค่าประเมิน</th>
                  </tr>
                </thead>
                <tbody style={{ divideY: '1px solid #334155' }}>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '1rem 1.5rem', color: '#94a3b8' }}>{new Date(log.created_at).toLocaleString('th-TH')}</td>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: '600', color: '#f8fafc' }}>{log.item_name}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ backgroundColor: '#0284c720', color: '#38bdf8', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid #0284c740' }}>
                          {log.waste_type}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: '#34d399', fontWeight: '500' }}>+{log.carbon_saved_kg} kg</td>
                      <td style={{ padding: '1rem 1.5rem', color: '#fbbf24', fontWeight: '500' }}>+{log.est_value_thb} ฿</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
