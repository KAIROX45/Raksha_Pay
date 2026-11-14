import React, { useState, useEffect } from 'react';
import {
  Flame,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  FileText,
  CheckCircle2,
  X,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { GlassCard } from '../../components/common/GlassCard';
import { PeachButton } from '../../components/common/PeachButton';
import api from '../../services/api';

interface FraudAlertItem {
  id: string;
  transaction_id?: string;
  user_name?: string;
  user_phone?: string;
  risk_score: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  signals: string[];
  explanation: string;
  gemini_analysis?: string;
  status: 'NEW' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  created_at: string;
  notes_count: number;
}

export const AdminFraudPage: React.FC = () => {
  const [alerts, setAlerts] = useState<FraudAlertItem[]>([]);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedAlert, setSelectedAlert] = useState<FraudAlertItem | null>(null);

  // Investigation Note form
  const [noteText, setNoteText] = useState('');
  const [statusChange, setStatusChange] = useState<string>('UNDER_REVIEW');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filterSeverity !== 'ALL') params.severity = filterSeverity;
      if (filterStatus !== 'ALL') params.status = filterStatus;

      const res = await api.get<FraudAlertItem[]>('/admin/fraud-alerts', { params });
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to load fraud alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [filterSeverity, filterStatus]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert || !noteText.trim()) return;

    setIsSubmittingNote(true);
    try {
      await api.post(`/admin/investigations/${selectedAlert.id}/notes`, {
        note: noteText.trim(),
        status_change: statusChange,
      });
      setNoteSuccess('Investigation note recorded into audit trail.');
      setNoteText('');
      setTimeout(() => {
        setNoteSuccess(null);
        setSelectedAlert(null);
        fetchAlerts();
      }, 1200);
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-5 h-5 text-rose-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
            Incident Workspace
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#D1E8E2] tracking-tight">
          Fraud Investigations
        </h1>
        <p className="text-xs sm:text-sm text-raksha-muted">
          Review suspicious telemetry, evaluate Gemini threat explanations, and log analyst findings.
        </p>
      </div>

      {/* Filter Tabs */}
      <GlassCard className="border border-rose-500/30 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-raksha-muted text-[11px] font-semibold mr-1">Severity:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                  filterSeverity === sev
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-[#1E2421] text-raksha-muted hover:text-[#D1E8E2]'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-raksha-muted text-[11px] font-semibold mr-1">Status:</span>
            {['ALL', 'NEW', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                  filterStatus === st
                    ? 'bg-primary text-[#D1E8E2] border border-primary-light/40'
                    : 'bg-[#1E2421] text-raksha-muted hover:text-[#D1E8E2]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-2 py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="col-span-2 py-20 text-center text-xs text-raksha-muted">
            No fraud incidents found matching selected filter parameters.
          </div>
        ) : (
          alerts.map((alert) => (
            <GlassCard
              key={alert.id}
              className="border border-rose-500/30 p-5 space-y-4 hover:border-rose-500/60 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : alert.severity === 'HIGH'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {alert.severity} • RISK {alert.risk_score}/100
                  </span>
                  <span className="font-mono text-xs text-accent font-semibold">{alert.status}</span>
                </div>

                <h3 className="text-sm font-bold text-[#D1E8E2] leading-snug">
                  {alert.explanation}
                </h3>

                <div className="p-3 rounded-xl bg-[#1E2421] border border-primary/30 space-y-1.5 text-xs">
                  <span className="text-[10px] text-raksha-muted uppercase font-semibold block">
                    Triggered Telemetry Flags
                  </span>
                  {alert.signals.map((sig, i) => (
                    <div key={i} className="text-rose-300 text-[11px] flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>{sig}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-primary/20 flex items-center justify-between text-xs">
                <span className="text-raksha-muted text-[11px]">
                  {new Date(alert.created_at).toLocaleString()}
                </span>
                <button
                  onClick={() => {
                    setSelectedAlert(alert);
                    setStatusChange(alert.status);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Case Workspace</span>
                </button>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Case Investigation Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="max-w-xl w-full border border-rose-500/40 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-primary/30">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4" />
                Case Investigation: Alert #{selectedAlert.id.substring(0, 8)}
              </span>
              <button onClick={() => setSelectedAlert(null)} className="text-raksha-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-bold text-[#D1E8E2] text-sm block">{selectedAlert.explanation}</span>
              <span className="text-raksha-muted block">
                Target User: {selectedAlert.user_name || 'Customer'} ({selectedAlert.user_phone || 'Simulated'})
              </span>
            </div>

            {/* Note form */}
            {noteSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto" />
                <p>{noteSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleAddNote} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-raksha-muted mb-1">
                    Update Incident Status
                  </label>
                  <select
                    value={statusChange}
                    onChange={(e) => setStatusChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1E2421] border border-primary/40 rounded-xl text-xs text-[#D1E8E2] focus:outline-none focus:border-rose-400"
                  >
                    <option value="UNDER_REVIEW">UNDER_REVIEW (Active Investigation)</option>
                    <option value="RESOLVED">RESOLVED (Mitigated / Confirmed Safe)</option>
                    <option value="DISMISSED">DISMISSED (False Positive)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-raksha-muted mb-1">
                    Analyst Findings / SOC Action Note
                  </label>
                  <textarea
                    rows={4}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Log forensic findings, telecom provider callback notes, or domain blacklist actions..."
                    className="w-full p-3 bg-[#1E2421] border border-primary/40 rounded-xl text-xs text-[#D1E8E2] placeholder-raksha-dim focus:outline-none focus:border-rose-400 font-mono"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <PeachButton type="submit" fullWidth isLoading={isSubmittingNote}>
                    Append Audit Note & Commit Status
                  </PeachButton>
                </div>
              </form>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
};
