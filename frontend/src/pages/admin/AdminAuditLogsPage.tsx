import React, { useState, useEffect } from 'react';
import { ScrollText, ShieldCheck, Clock, RefreshCw } from 'lucide-react';
import { GlassCard } from '../../components/common/GlassCard';
import api from '../../services/api';

interface AuditLogItem {
  id: string;
  actor_id?: string;
  actor_role: string;
  action: string;
  target_type: string;
  target_id?: string;
  ip_address?: string;
  details: Record<string, any>;
  created_at?: string;
}

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<AuditLogItem[]>('/admin/audit-logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#D1E8E2] tracking-tight">
            Immutable Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-raksha-muted">
            Append-only system security log capturing all critical administrative actions and payment transitions.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-[#242C28] border border-primary/40 text-xs text-[#D1E8E2] hover:text-accent flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Logs Table */}
      <GlassCard className="border border-primary/40 p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-accent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-xs text-raksha-muted">
            No audit records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1E2421] border-b border-primary/30 text-raksha-muted uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor Role</th>
                  <th className="py-3 px-4">Security Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Metadata Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/20 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#242C28] transition-colors">
                    <td className="py-3 px-4 text-raksha-muted text-[11px] whitespace-nowrap">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase inline-block ${
                          log.actor_role === 'admin'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-primary/20 text-[#D1E8E2] border-primary/40'
                        }`}
                      >
                        {log.actor_role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-accent">{log.action}</td>
                    <td className="py-3 px-4 text-[#D1E8E2]">
                      {log.target_type} {log.target_id ? `(#${log.target_id.substring(0, 8)})` : ''}
                    </td>
                    <td className="py-3 px-4 text-raksha-dim">{log.ip_address || '127.0.0.1'}</td>
                    <td className="py-3 px-4 text-raksha-muted max-w-xs truncate text-[11px]">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
