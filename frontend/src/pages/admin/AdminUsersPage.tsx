import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  X,
} from 'lucide-react';
import { GlassCard } from '../../components/common/GlassCard';
import { PeachButton } from '../../components/common/PeachButton';
import api from '../../services/api';

interface AdminUserItem {
  id: string;
  phone: string;
  full_name: string;
  email?: string;
  role: string;
  status: 'active' | 'suspended';
  is_demo: boolean;
  created_at?: string;
  upi_id?: string;
  balance_rupees?: number;
}

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [targetUser, setTargetUser] = useState<AdminUserItem | null>(null);
  const [suspendReason, setSuspendReason] = useState('Suspicious velocity or multiple fraud reports');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<AdminUserItem[]>('/admin/users', {
        params: searchTerm.trim() ? { search: searchTerm.trim() } : undefined,
      });
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;

    const newStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    setIsUpdating(true);
    try {
      await api.patch(`/admin/users/${targetUser.id}/status`, {
        status: newStatus,
        reason: suspendReason,
      });
      setTargetUser(null);
      await fetchUsers();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#D1E8E2] tracking-tight">
          User Directory & Account Controls
        </h1>
        <p className="text-xs sm:text-sm text-raksha-muted">
          Manage customer account statuses. Soft-suspension prevents logins while preserving transaction ledger integrity.
        </p>
      </div>

      {/* Search Header */}
      <GlassCard className="border border-primary/40 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchUsers();
          }}
          className="relative max-w-sm"
        >
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-raksha-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#1E2421] border border-primary/40 rounded-xl text-xs text-[#D1E8E2] placeholder-raksha-dim focus:outline-none focus:border-accent"
          />
        </form>
      </GlassCard>

      {/* Users Table */}
      <GlassCard className="border border-primary/40 p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-accent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-xs text-raksha-muted">
            No users found matching query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1E2421] border-b border-primary/30 text-raksha-muted uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Simulated UPI</th>
                  <th className="py-3 px-4">Simulated Balance</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/20">
                {users.map((u) => {
                  const isActive = u.status === 'active';
                  return (
                    <tr key={u.id} className="hover:bg-[#242C28] transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#D1E8E2] block">{u.full_name}</span>
                        {u.is_demo && (
                          <span className="text-[10px] text-accent uppercase font-mono font-semibold">
                            [DEMO]
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-raksha-muted">{u.phone}</td>
                      <td className="py-3.5 px-4 font-mono text-accent">{u.upi_id || 'N/A'}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#D1E8E2]">
                        ₹{(u.balance_rupees ?? 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3.5 px-4 uppercase text-[10px] font-semibold text-raksha-muted">
                        {u.role}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {u.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => setTargetUser(u)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ml-auto ${
                              isActive
                                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            <span>{isActive ? 'Suspend' : 'Reactivate'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Soft-Suspension Confirmation Modal */}
      {targetUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="max-w-md w-full border border-primary/50 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-primary/30">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                {targetUser.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
              </span>
              <button onClick={() => setTargetUser(null)} className="text-raksha-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-raksha-muted leading-relaxed">
              Are you sure you want to {targetUser.status === 'active' ? 'suspend' : 'reactivate'}{' '}
              <strong className="text-[#D1E8E2]">{targetUser.full_name}</strong> ({targetUser.phone})?
              All ledger balances and past transactions will remain intact.
            </p>

            <form onSubmit={handleToggleStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-raksha-muted mb-1">
                  Reason for Action (Logged to Audit Trail)
                </label>
                <input
                  type="text"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1E2421] border border-primary/40 rounded-xl text-xs text-[#D1E8E2] focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <PeachButton
                type="submit"
                fullWidth
                isLoading={isUpdating}
                variant={targetUser.status === 'active' ? 'secondary' : 'primary'}
              >
                Confirm Status Change
              </PeachButton>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
