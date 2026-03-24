import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: '일일 차트', icon: '📊' },
  { to: '/manager', label: '데이터 관리', icon: '📁' },
  { to: '/settings', label: '설정', icon: '⚙️' },
];

export default function Sidebar() {
  return (
    <aside className="w-52 h-screen bg-surface border-r border-overlay flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-overlay">
        <h1 className="text-lg font-bold text-blue tracking-tight">Day Viewer</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-colors no-underline ${
                isActive
                  ? 'bg-brand/15 text-brand'
                  : 'text-subtext hover:bg-overlay hover:text-text'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
