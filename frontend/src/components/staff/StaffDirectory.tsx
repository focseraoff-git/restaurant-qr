import { useState } from 'react';
import { useStaffStore } from '../../store/useStaffStore';
import { Modal } from '../Modal';

export const StaffDirectory = ({ restaurantId, showToast }: { restaurantId: string, showToast: any }) => {
    // Consume Global Store
    const { staff, loading, addStaff, updateStaff } = useStaffStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        phone: '',
        salary_type: 'monthly',
        base_salary: 0,
        restaurant_id: restaurantId
    });

    const handleEdit = (s: any) => {
        setEditingId(s.id);
        setFormData({
            name: s.name,
            role: s.role,
            phone: s.phone || '',
            salary_type: s.salary_type,
            base_salary: s.base_salary,
            restaurant_id: restaurantId
        });
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({
            name: '',
            role: '',
            phone: '',
            salary_type: 'monthly',
            base_salary: 0,
            restaurant_id: restaurantId
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateStaff(editingId, formData);
                showToast('Staff details updated!', 'success');
            } else {
                await addStaff(formData);
                showToast('Staff member added!', 'success');
            }
            handleClose();
        } catch (err) {
            showToast('Failed to save staff', 'error');
        }
    };

    if (loading) return <div className="text-center py-20 opacity-50 font-bold animate-pulse">Loading directory...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        👥 Staff Directory
                        <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg border border-emerald-500/20">{staff.length} Active</span>
                    </h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Manage Roles & Profiles</p>
                </div>
                <button
                    onClick={() => { setEditingId(null); setIsModalOpen(true); }}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transform active:scale-95 flex items-center gap-2"
                >
                    <span className="text-lg">+</span> Register Staff
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staff.map(s => (
                    <div key={s.id} className="glass-panel p-6 rounded-2xl relative group hover:border-emerald-500/30 transition-all duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex gap-4 items-center">
                                <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center text-2xl border border-white/10 shadow-inner">
                                    {s.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{s.name}</h3>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">{s.role}</p>
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider border ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                {s.status}
                            </span>
                        </div>

                        <div className="space-y-3 border-t border-white/5 pt-4">
                            <div className="flex justify-between text-xs items-center">
                                <span className="text-gray-500 uppercase tracking-widest font-bold text-[10px]">Salary Type</span>
                                <span className="font-bold text-gray-300 capitalize bg-white/5 px-2 py-1 rounded border border-white/5">{s.salary_type}</span>
                            </div>
                            <div className="flex justify-between text-xs items-center">
                                <span className="text-gray-500 uppercase tracking-widest font-bold text-[10px]">Base Pay</span>
                                <span className="font-bold text-emerald-400 font-mono text-sm">₹{s.base_salary.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs items-center">
                                <span className="text-gray-500 uppercase tracking-widest font-bold text-[10px]">Contact</span>
                                <span className="font-bold text-gray-300">{s.phone}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-dashed border-white/10">
                            <button
                                onClick={() => handleEdit(s)}
                                className="py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-white/5 hover:text-white flex items-center justify-center gap-2"
                            >
                                <span>✏️</span> Edit
                            </button>
                            <button className="py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold transition-all border border-emerald-500/20 hover:border-emerald-500/30 flex items-center justify-center gap-2">
                                <span>📄</span> Profile
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Staff Modal */}
            <Modal isOpen={isModalOpen} onClose={handleClose} title={editingId ? "Edit Staff Details" : "Register New Staff"}>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Full Name</label>
                            <input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="input-field w-full"
                                placeholder="Staff Name"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Role</label>
                            <select
                                required
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                                className="input-field w-full appearance-none capitalize"
                            >
                                <option value="" disabled>Select Role</option>
                                <option value="admin">Admin</option>
                                <option value="billing">Billing</option>
                                <option value="inventory">Inventory</option>
                                <option value="staff">Staff</option>
                                <option value="counter">Counter</option>
                                <option value="waiter">Waiter</option>
                                <option value="kitchen">Kitchen</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Contact</label>
                            <input
                                required
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="input-field w-full"
                                placeholder="Phone Number"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Salary Type</label>
                            <select
                                value={formData.salary_type}
                                onChange={e => setFormData({ ...formData, salary_type: e.target.value })}
                                className="input-field w-full appearance-none"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="daily">Daily</option>
                                <option value="hourly">Hourly</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Base Amount (₹)</label>
                            <input
                                type="number"
                                required
                                value={formData.base_salary}
                                onChange={e => setFormData({ ...formData, base_salary: parseFloat(e.target.value) })}
                                className="input-field w-full"
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full btn-primary py-4 rounded-xl mt-4 uppercase tracking-widest text-xs font-black shadow-xl shadow-emerald-500/20">
                        {editingId ? "Update Details" : "Submit Registration"}
                    </button>
                </form>
            </Modal>
        </div>
    );
};
