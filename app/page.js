'use client';
import { useState, useRef } from 'react';

export default function Home() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [bottleCount, setBottleCount] = useState(10);
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

  // คำนวณค่าประมาณการขวดพลาสติก PET (น้ำหนักเฉลี่ย 25g, ราคา 0.25 บาท, ลดคาร์บอน 0.026 kgCO2e/ขวด)
  const calcWeight = (bottleCount * 25) / 1000;
  const calcValue = (bottleCount * 0.25).toFixed(2);
  const calcCarbon = (bottleCount * 0.026).toFixed(3);

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
        <section style={{ background: '#1e293b', borderRadius: '20px', border: '1px solid #334155', padding: '2rem 1.5rem', textAlign: 'center', marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)' }}>
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
                boxShadow: '0 4px 16px rgba(16
