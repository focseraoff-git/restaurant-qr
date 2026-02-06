import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogoutButton } from '../components/auth/LogoutButton';
import { useStaffStore } from '../store/useStaffStore';
import { Toast } from '../components/Toast';
import { StaffDirectory } from '../components/staff/StaffDirectory';
import { AttendanceTracker } from '../components/staff/AttendanceTracker';
import { PayrollDashboard } from '../components/staff/PayrollDashboard';
import { AdvanceTracker } from '../components/staff/AdvanceTracker';
import { PendingActions } from '../components/staff/PendingActions';

export const StaffManagement = () => {
    const { restaurantId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('directory');
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    const { stats, init } = useStaffStore();

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
    }, []);

    useEffect(() => {
        if (restaurantId) {
            init(restaurantId);
        }
    }, [restaurantId, init]);

    const tabs = [
        { id: 'directory', label: 'Staff Directory', icon: '👥' },
        { id: 'attendance', label: 'Attendance', icon: '📅' },
        { id: 'payroll', label: 'Payroll', icon: '💰' },
        { id: 'advances', label: 'Advances', icon: '💸' },
        { id: 'pending', label: 'Pending', icon: '⚠️' }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans pb-20 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-900/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Header */}
            <header className="glass-nav px-8 py-5 flex justify-between items-center sticky top-0 z-30 mb-6 shrink-0 backdrop-blur-md bg-slate-900/80 border-b border-white/5">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-xl hover:bg-white/10">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <h1 className="text-2xl font-serif font-medium tracking-tight flex items-center gap-1 group cursor-default">
                        <span className="text-white group-hover:text-emerald-50 transition-colors">Focsera</span>
                        <span className="text-emerald-400 italic font-light relative">
                            DineQR
                            <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full blur-[1px] opacity-80 animate-pulse"></span>
                        </span>
                        <span className="ml-3 px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] font-sans text-gray-400 font-bold uppercase tracking-wider">Staff</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-2 animate-pulse">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        LIVE SYSTEM
                    </div>
                    <LogoutButton />
                </div>

            </header>

            <main className="p-4 md:p-8 max-w-7xl mx-auto w-full relative z-10">
                {/* Dashboard Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="text-4xl">👥</span>
                        </div>
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-2">Active Staff</p>
                        <h3 className="text-3xl font-black text-white">{stats.totalStaff}</h3>
                        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 w-full opacity-50"></div>
                    </div>
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="text-4xl">📍</span>
                        </div>
                        <p className="text-emerald-400/80 text-[10px] uppercase font-bold tracking-wider mb-2">Present Today</p>
                        <h3 className="text-3xl font-black text-emerald-400">{stats.presentToday}</h3>
                        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 w-full opacity-50"></div>
                    </div>
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="text-4xl">💰</span>
                        </div>
                        <p className="text-amber-400/80 text-[10px] uppercase font-bold tracking-wider mb-2">Salary Pending</p>
                        <h3 className="text-3xl font-black text-amber-400">₹{stats.salaryPending}</h3>
                        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 w-full opacity-50"></div>
                    </div>
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="text-4xl">💸</span>
                        </div>
                        <p className="text-red-400/80 text-[10px] uppercase font-bold tracking-wider mb-2">Advances</p>
                        <h3 className="text-3xl font-black text-red-400">₹{stats.advancesOutstanding}</h3>
                        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-red-500 to-pink-500 w-full opacity-50"></div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all border ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent shadow-lg shadow-emerald-500/20'
                                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px] animate-fade-in">
                    {activeTab === 'directory' && <StaffDirectory restaurantId={restaurantId!} showToast={showToast} />}
                    {activeTab === 'attendance' && <AttendanceTracker restaurantId={restaurantId!} showToast={showToast} />}
                    {activeTab === 'payroll' && <PayrollDashboard restaurantId={restaurantId!} showToast={showToast} />}
                    {activeTab === 'advances' && <AdvanceTracker showToast={showToast} />}
                    {activeTab === 'pending' && <PendingActions showToast={showToast} />}
                </div>
            </main>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};
