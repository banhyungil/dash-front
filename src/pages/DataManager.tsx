import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PathIngest from '../components/PathIngest';
import FileUpload from '../components/FileUpload';
import IngestStatus from '../components/IngestStatus';

type IngestTab = 'path' | 'upload';

export default function DataManager() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<IngestTab>('path');

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/')}>
          ← 뒤로
        </button>
        <h1 style={styles.title}>데이터 관리</h1>
        <div style={{ width: 80 }} />
      </div>

      <div style={styles.content}>
        {/* Ingest section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>데이터 적재</h2>

          {/* Tabs */}
          <div style={styles.tabs}>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 'path' ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab('path')}
            >
              로컬 경로
            </button>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 'upload' ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab('upload')}
            >
              파일 업로드
            </button>
          </div>

          {/* Tab content */}
          <div style={styles.tabContent}>
            {activeTab === 'path' && <PathIngest />}
            {activeTab === 'upload' && <FileUpload />}
          </div>
        </div>

        {/* Status section */}
        <div style={styles.section}>
          <IngestStatus />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    background: '#1e1e2e',
    color: '#cdd6f4',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: '#181825',
    borderBottom: '1px solid #313244',
  },
  backBtn: {
    padding: '8px 16px',
    background: '#313244',
    color: '#cdd6f4',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#89b4fa',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    maxWidth: 800,
    margin: '0 auto',
    width: '100%',
  },
  section: {
    background: '#313244',
    borderRadius: 12,
    padding: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#cdd6f4',
    marginBottom: 16,
  },
  tabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    padding: '8px 20px',
    background: '#1e1e2e',
    color: '#a6adc8',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: '#2563EB',
    color: '#FFFFFF',
  },
  tabContent: {
    minHeight: 200,
  },
};
