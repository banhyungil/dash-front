import { useState } from 'react';
import PathIngest from '../components/PathIngest';
import FileUpload from '../components/FileUpload';
import IngestStatus from '../components/IngestStatus';

type IngestTab = 'path' | 'upload';

export default function DataManagerPage() {
  const [activeTab, setActiveTab] = useState<IngestTab>('path');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-6 py-4 border-b border-overlay">
        <h1 className="text-xl font-bold text-blue">데이터 관리</h1>
      </div>

      <div className="flex-1 overflow-auto p-6 flex flex-col gap-6 max-w-200 mx-auto w-full">
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
          <div className="min-h-50">
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
