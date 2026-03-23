import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PathIngest from '../components/PathIngest';
import FileUpload from '../components/FileUpload';
import IngestStatus from '../components/IngestStatus';

type IngestTab = 'path' | 'upload';

export default function DataManagerPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<IngestTab>('path');

  return (
    <div className="flex flex-col h-screen w-screen bg-bg text-text">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-surface border-b border-overlay">
        <button
          className="px-4 py-2 bg-overlay text-text border-none rounded-md text-[13px] font-semibold cursor-pointer"
          onClick={() => navigate('/')}
        >
          ← 뒤로
        </button>
        <h1 className="text-xl font-bold text-blue">데이터 관리</h1>
        <div className="w-20" />
      </div>

      <div className="flex-1 overflow-auto p-6 flex flex-col gap-6 max-w-[800px] mx-auto w-full">
        {/* Ingest section */}
        <div className="bg-overlay rounded-xl p-6">
          <h2 className="text-base font-semibold text-text mb-4">데이터 적재</h2>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              className={`px-5 py-2 border-none rounded-md text-[13px] font-semibold cursor-pointer transition-all ${
                activeTab === 'path'
                  ? 'bg-brand text-white'
                  : 'bg-bg text-subtext'
              }`}
              onClick={() => setActiveTab('path')}
            >
              로컬 경로
            </button>
            <button
              className={`px-5 py-2 border-none rounded-md text-[13px] font-semibold cursor-pointer transition-all ${
                activeTab === 'upload'
                  ? 'bg-brand text-white'
                  : 'bg-bg text-subtext'
              }`}
              onClick={() => setActiveTab('upload')}
            >
              파일 업로드
            </button>
          </div>

          {/* Tab content */}
          <div className="min-h-[200px]">
            {activeTab === 'path' && <PathIngest />}
            {activeTab === 'upload' && <FileUpload />}
          </div>
        </div>

        {/* Status section */}
        <div className="bg-overlay rounded-xl p-6">
          <IngestStatus />
        </div>
      </div>
    </div>
  );
}
