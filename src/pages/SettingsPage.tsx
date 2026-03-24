import SettingsPanel from '../components/SettingsPanel';

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center px-6 py-4 border-b border-overlay">
        <h1 className="text-xl font-bold text-blue">설정</h1>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <SettingsPanel />
      </div>
    </div>
  );
}
