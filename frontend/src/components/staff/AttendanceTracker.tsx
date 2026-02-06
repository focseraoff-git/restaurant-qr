import { useState, useEffect } from 'react';
import { useStaffStore } from '../../store/useStaffStore';
import { getLocalDate } from '../../utils/date';



export const AttendanceTracker = ({ restaurantId, showToast }: { restaurantId: string, showToast: any }) => {
    // Consume Global Store
    const { staff, attendance, markAttendance: storeMarkAttendance, loading, refresh } = useStaffStore();

    // UI Local State
    const [date, setDate] = useState(getLocalDate());
    const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

    // Filter active staff from global store
    const activeStaff = staff.filter((s: any) => s.status === 'active');

    // React to date changes
    useEffect(() => {
        if (restaurantId) {
            refresh(restaurantId, date);
        }
    }, [date, restaurantId, refresh]);

    const handleMark = async (staffId: string, status: string) => {
        console.log(`[UI] Marking staff ${staffId} as ${status} for date ${date}`);
        await storeMarkAttendance(staffId, status, attendance[staffId]?.notes || '', date);
        console.log(`[UI] Mark action completed`);
    };

    const updateNoteDraft = (staffId: string, text: string) => {
        setNoteDrafts({ ...noteDrafts, [staffId]: text });
    };

    const saveNote = async (staffId: string) => {
        const text = noteDrafts[staffId];
        if (text === undefined) return; // No change

        await storeMarkAttendance(staffId, attendance[staffId]?.status || 'present', text, date);
        showToast('Note saved', 'success');
    };

    const markAllPresent = async () => {
        activeStaff.forEach(s => {
            if (!attendance[s.id] || attendance[s.id].status !== 'present') {
                handleMark(s.id, 'present');
            }
        });
        showToast('Marking all as present...', 'info');
    };

    const statusMap = [
        { id: 'present', label: 'Present', short: 'P', color: 'bg-emerald-500 shadow-emerald-500/50' },
        { id: 'absent', label: 'Absent', short: 'A', color: 'bg-red-500 shadow-red-500/50' },
        { id: 'half-day', label: 'Half-Day', short: 'H', color: 'bg-amber-500 shadow-amber-500/50' },
        { id: 'leave', label: 'Leave', short: 'L', color: 'bg-indigo-500 shadow-indigo-500/50' }
    ];

    if (loading) return <div className="text-center py-20 opacity-50 font-bold animate-pulse">Syncing live attendance...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        📅 Daily Attendance
                        <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg border border-emerald-500/20">{date}</span>
                    </h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Track Staff Presence</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto items-center">
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
                    />
                    <button
                        onClick={markAllPresent}
                        className="flex-1 md:flex-none bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-emerald-500/20 hover:border-emerald-500/40"
                    >
                        Mark All Present
                    </button>
                </div>
            </div>

            <div className="glass-panel overflow-hidden rounded-3xl border border-white/5 shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                        <tr>
                            <th className="px-8 py-5">Staff Member</th>
                            <th className="px-8 py-5 text-center">Status</th>
                            <th className="px-8 py-5">Daily Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {activeStaff.map((s: any) => {
                            const record = attendance[s.id] || {};
                            const currentNote = noteDrafts[s.id] !== undefined ? noteDrafts[s.id] : (record.notes || '');

                            return (
                                <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center border border-white/10 font-bold text-gray-400">
                                                {s.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-100 text-lg">{s.name}</p>
                                                <p className="text-[10px] text-emerald-500/80 uppercase tracking-widest font-black">{s.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex gap-3 justify-center">
                                            {statusMap.map(status => (
                                                <button
                                                    key={status.id}
                                                    type="button"
                                                    onClick={() => handleMark(s.id, status.id)}
                                                    className={`w-12 h-12 flex items-center justify-center rounded-2xl border text-sm font-black transition-all duration-300 transform ${record.status === status.id
                                                        ? `${status.color} text-white scale-110 shadow-lg border-transparent z-10`
                                                        : 'bg-white/5 border-white/5 text-gray-600 hover:bg-white/10 hover:text-gray-400 hover:scale-105'
                                                        }`}
                                                    title={status.label}
                                                >
                                                    {status.short}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="relative">
                                            <input
                                                placeholder="Add localized note..."
                                                value={currentNote}
                                                onChange={e => updateNoteDraft(s.id, e.target.value)}
                                                onBlur={() => saveNote(s.id)}
                                                className="w-full bg-transparent border-b border-gray-700 px-2 py-2 text-sm text-gray-300 placeholder-gray-700 outline-none focus:border-emerald-500/50 transition-colors"
                                            />
                                            <span className="absolute right-0 top-2 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
