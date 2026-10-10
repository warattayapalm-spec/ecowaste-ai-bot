'use client';
import { useState, useRef } from 'react';

export default function Home() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

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
      } else {
        alert('เกิดข้อผิดพลาดในการวิเคราะห์: ' + (data.error || 'โปรดลองอีกครั้ง'));
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header */}
      <header style={{ borderBottom: '1px solid #1e293b', backgroundColor: '#0f172a', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.25rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
              🌱
            </div>
            <div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, color: '#fff', letterSpacing: '-0.02em' }}>EcoWaste AI</h1>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Smart Camera Waste Classifier</p>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', backgroundColor: '#064e3b', color: '#34d399', padding: '0.3rem 0.8rem', borderRadius: '9999px', fontWeight: '600', border: '1px solid #059669' }}>
            ● AI Ready
          </span>
        </div>
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>
        
        {/* Camera Upload Section */}
        <section style={{ background: '#1e293b', borderRadius: '20px', border: '1px solid #334155', padding: '2rem 1.5rem', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)' }}>
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
              <img src={preview} alt="Preview" style={{ maxHeight: '260px', borderRadius: '14px', border: '2px solid #475569', objectFit: 'contain' }} />
            </div>
          )}

          <div style={{ maxWidth: '380px', margin: '0 auto' }}>
            <button 
              onClick={() => fileInputRef.current.click()} 
              disabled={analyzing}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                color: 'white',
                padding: '1rem 1.5rem',
                fontSize: '1.05rem',
                fontWeight: '700',
                border: 'none',
                borderRadius: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              {analyzing ? '⏳ กำลังประมวลผล AI...' : '📸 ถ่ายรูป / สแกนขยะบนเว็บ'}
            </button>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.75rem 0 0' }}>
              เปิดกล้องมือถือถ่ายขยะได้ทันที ระบบจะช่วยประเมินประเภท น้ำหนัก และมูลค่าให้อัตโนมัติ
            </p>
          </div>

          {/* AI Result Box */}
          {result && (
            <div style={{ marginTop: '2rem', textAlign: 'left', background: '#0f172a', padding: '1.5rem', borderRadius: '16px', border: '1px solid #059669', boxShadow: '0 4px 20px rgba(5, 150, 105, 0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #1e293b' }}>
                <span style={{ fontSize: '1.3rem' }}>✨</span>
                <h3 style={{ margin: 0, color: '#34d399', fontSize: '1.1rem', fontWeight: '700' }}>ผลการวิเคราะห์โดย AI</h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
                <div><span style={{ color: '#94a3b8' }}>ชื่อวัตถุ:</span> <strong style={{ color: '#f8fafc', display: 'block', fontSize: '1rem' }}>{result.item_name}</strong></div>
                <div><span style={{ color: '#94a3b8' }}>หมวดหมู่:</span> <strong style={{ color: '#38bdf8', display: 'block', fontSize: '1rem' }}>{result.waste_type}</strong></div>
                <div><span style={{ color: '#94a3b8' }}>ทิ้งในถังสี:</span> <strong style={{ color: '#facc15', display: 'block', fontSize: '1rem' }}>{result.bin_color}</strong></div>
                <div><span style={{ color: '#94a3b8' }}>น้ำหนักประเมิน:</span> <strong style={{ color: '#e2e8f0', display: 'block', fontSize: '1rem' }}>~{result.est_weight_g} กรัม</strong></div>
                <div><span style={{ color: '#94a3b8' }}>ลดคาร์บอน:</span> <strong style={{ color: '#34d399', display: 'block', fontSize: '1rem' }}>+{result.carbon_saved_kg} kgCO2e</strong></div>
                <div><span style={{ color: '#94a3b8' }}>มูลค่าประเมิน:</span> <strong style={{ color: '#fbbf24', display: 'block', fontSize: '1rem' }}>+{result.est_value_thb} บาท</strong></div>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px dashed #334155', fontSize: '0.875rem' }}>
                <span style={{ color: '#94a3b8', fontWeight: '600' }}>💡 วิธีจัดเตรียมก่อนทิ้ง: </span>
                <span style={{ color: '#e2e8f0' }}>{result.disposal_guide}</span>
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
