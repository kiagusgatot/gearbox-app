import { ReactNode } from 'react'
import Sidebar from './Sidebar'

interface AdminLayoutProps {
  children: ReactNode
}

/**
 * Wrapper layout admin yang responsive.
 * - Desktop: sidebar kiri tetap + main content kanan
 * - Mobile: top bar + konten full width (sidebar jadi drawer)
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F0F2F5' }}>
      <Sidebar />
      <main
        className="admin-main"
        style={{ flex: 1, minWidth: 0, overflowX: 'hidden' }}
      >
        {children}
      </main>

      <style>{`
        /* Desktop padding normal */
        .admin-main { padding: 36px 32px; }

        /* Mobile: tambah top padding karena ada fixed top bar */
        @media (max-width: 767px) {
          .admin-main { padding: 68px 16px 24px; }
        }

        /* Tabel: horizontal scroll di mobile */
        .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }

        /* Page title lebih kecil di mobile */
        @media (max-width: 767px) {
          .page-title { font-size: 1.5rem !important; }
          .page-eyebrow { font-size: 10px !important; }
        }

        /* Grid 4 kolom → 2 kolom → 1 kolom */
        .stat-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        @media (max-width: 1024px) {
          .stat-grid-4 { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .stat-grid-4 { grid-template-columns: 1fr; }
        }

        /* Grid 5 kolom (status cards booking) */
        .stat-grid-5 {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
        }
        @media (max-width: 1024px) {
          .stat-grid-5 { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 480px) {
          .stat-grid-5 { grid-template-columns: repeat(2, 1fr); }
        }

        /* Grid bay cards 3 kolom → 2 → 1 */
        .bay-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        @media (max-width: 1024px) {
          .bay-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .bay-grid { grid-template-columns: 1fr; }
        }

        /* Filter bar wrap di mobile */
        .filter-bar {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        /* Header halaman — stack di mobile */
        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 12px;
        }
        @media (max-width: 600px) {
          .page-header {
            flex-direction: column;
            align-items: stretch;
          }
          .page-header .header-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }
        }

        /* Sembunyikan kolom sekunder di mobile */
        @media (max-width: 768px) {
          .col-hide-mobile { display: none !important; }
        }
        @media (max-width: 480px) {
          .col-hide-sm { display: none !important; }
        }

        /* Card info kecil di mobile */
        @media (max-width: 480px) {
          .info-card-sm { min-width: unset !important; width: 100%; }
        }
      `}</style>
    </div>
  )
}
