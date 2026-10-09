export const metadata = {
  title: 'EcoWaste AI Dashboard',
  description: 'ระบบวิเคราะห์ขยะและคำนวณคาร์บอนเครดิตอัจฉริยะ',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f8f9fa' }}>
        {children}
      </body>
    </html>
  );
}
