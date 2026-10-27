import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import "../styles/dashboard.css";
import "../styles/challenges.css";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import { useAuth } from "../context/AuthContext";
import {
  getChallenges,
  createChallenge,
  updateChallenge,
  recordContribution,
  pauseChallenge,
  resumeChallenge,
  deleteChallenge,
} from "../services/challengeService";

import {
  FiPlus,
  FiTarget,
  FiZap,
  FiTrendingUp,
  FiAward,
  FiCalendar,
  FiClock,
  FiChevronRight,
  FiEdit2,
  FiTrash2,
  FiPause,
  FiPlay,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiDollarSign,
  FiLoader,
  FiFlag,
  FiStar,
} from "react-icons/fi";

// ─── Helpers ──────────────────────────────────────────────
const INR = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(d).slice(0, 10);
  }
};

const CHALLENGE_TYPES = [
  { value: "custom",         label: "Custom Challenge",           emoji: "✨" },
  { value: "30_day",         label: "30-Day Sprint",               emoji: "🚀" },
  { value: "90_day",         label: "90-Day Habit Builder",        emoji: "📅" },
  { value: "target_savings", label: "Target Savings",              emoji: "💰" },
  { value: "emergency_fund", label: "Emergency Fund",              emoji: "🛡️" },
  { value: "no_spend",       label: "No-Spend Challenge",          emoji: "🚫" },
];

const TYPE_EMOJI = Object.fromEntries(
  CHALLENGE_TYPES.map((t) => [t.value, t.emoji])
);

const STATUS_LABELS = {
  active:      "Active",
  completed:   "Completed ✓",
  paused:      "Paused",
  overdue:     "Overdue",
  not_started: "Not Started",
};

// ─── Status helpers ───────────────────────────────────────
function statusClass(status) {
  const m = {
    active:      "active",
    completed:   "completed",
    paused:      "paused",
    overdue:     "overdue",
    not_started: "not_started",
  };
  return m[status] || "active";
}

function progressFillClass(status) {
  if (status === "completed") return "completed-fill";
  if (status === "overdue")   return "overdue-fill";
  return "";
}

// ─── Default dates ─────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function futureStr(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ─── Create/Edit Challenge Modal ──────────────────────────
function ChallengeModal({ isOpen, onClose, onSubmit, editingChallenge, recommendations }) {
  const isEdit = Boolean(editingChallenge);

  const [title,          setTitle]          = useState("");
  const [description,    setDescription]    = useState("");
  const [type,           setType]           = useState("custom");
  const [targetAmount,   setTargetAmount]   = useState("");
  const [startingAmount, setStartingAmount] = useState("");
  const [startDate,      setStartDate]      = useState(todayStr());
  const [endDate,        setEndDate]        = useState(futureStr(30));
  const [error,          setError]          = useState("");
  const [loading,        setLoading]        = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingChallenge) {
      setTitle(editingChallenge.title || "");
      setDescription(editingChallenge.description || "");
      setType(editingChallenge.type || "custom");
      setTargetAmount(String(editingChallenge.targetAmount || ""));
      setStartingAmount("");
      setStartDate(
        editingChallenge.startDate
          ? new Date(editingChallenge.startDate).toISOString().slice(0, 10)
          : todayStr()
      );
      setEndDate(
        editingChallenge.endDate
          ? new Date(editingChallenge.endDate).toISOString().slice(0, 10)
          : futureStr(30)
      );
    } else {
      setTitle("");
      setDescription("");
      setType("custom");
      setTargetAmount("");
      setStartingAmount("");
      setStartDate(todayStr());
      setEndDate(futureStr(30));
    }
    setError("");
  }, [isOpen, editingChallenge]);

  const applyPreset = (preset) => {
    setTitle(preset.title);
    setType(preset.type);
    setTargetAmount(String(preset.targetAmount));
    setEndDate(futureStr(preset.durationDays));
    setDescription(preset.description || "");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("Please enter a challenge name."); return; }
    const target = Number(targetAmount);
    if (!Number.isFinite(target) || target < 1) {
      setError("Target amount must be at least ₹1.");
      return;
    }
    if (!endDate) { setError("Please set a target completion date."); return; }
    if (new Date(endDate) <= new Date(startDate)) {
      setError("Completion date must be after the start date.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        title:         title.trim(),
        description:   description.trim(),
        type,
        targetAmount:  target,
        startingAmount: isEdit ? undefined : Number(startingAmount) || 0,
        startDate,
        endDate,
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const presets = recommendations?.presets || [];

  return (
    <div className="challenge-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="challenge-modal">
        <div className="challenge-modal-header">
          <h2>{isEdit ? "Edit Challenge" : "Create New Challenge"}</h2>
          <button className="challenge-modal-close" onClick={onClose} type="button" aria-label="Close">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="challenge-modal-body">
            {error && <div className="modal-error">{error}</div>}

            {/* Presets */}
            {!isEdit && presets.length > 0 && (
              <div className="form-group">
                <label>Quick Presets</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {presets.slice(0, 4).map((preset) => (
                    <button
                      key={preset.presetId}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      style={{
                        padding: "6px 12px",
                        border: "1.5px solid #e9e3ff",
                        borderRadius: "8px",
                        background: "#fdfbff",
                        color: "#7c3aed",
                        fontSize: "0.78rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = "#f3eeff";
                        e.target.style.borderColor = "#7c3aed";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "#fdfbff";
                        e.target.style.borderColor = "#e9e3ff";
                      }}
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="ch-title">Challenge Name *</label>
              <input
                id="ch-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Save ₹10,000 for travel"
                maxLength={120}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="ch-type">Challenge Type</label>
              <select id="ch-type" value={type} onChange={(e) => setType(e.target.value)}>
                {CHALLENGE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.emoji} {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ch-target">Target Amount (₹) *</label>
                <input
                  id="ch-target"
                  type="number"
                  min="1"
                  step="any"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="e.g., 10000"
                  required
                />
              </div>
              {!isEdit && (
                <div className="form-group">
                  <label htmlFor="ch-starting">Starting Amount (₹)</label>
                  <input
                    id="ch-starting"
                    type="number"
                    min="0"
                    step="any"
                    value={startingAmount}
                    onChange={(e) => setStartingAmount(e.target.value)}
                    placeholder="Already saved (optional)"
                  />
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ch-start">Start Date</label>
                <input
                  id="ch-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="ch-end">Target Completion *</label>
                <input
                  id="ch-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="ch-desc">Description (Optional)</label>
              <textarea
                id="ch-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a note about what you're saving for..."
                maxLength={500}
                rows={3}
              />
            </div>
          </div>

          <div className="challenge-modal-footer">
            <button type="button" className="modal-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-submit-btn" disabled={loading}>
              {loading ? <FiLoader style={{ animation: "spin 0.8s linear infinite" }} /> : null}
              {loading ? " Saving..." : isEdit ? "Save Changes" : "Create Challenge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Contribute Modal ──────────────────────────────────────
function ContributeModal({ isOpen, onClose, onSubmit, challenge }) {
  const [amount, setAmount]   = useState("");
  const [notes,  setNotes]    = useState("");
  const [date,   setDate]     = useState(todayStr());
  const [error,  setError]    = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setNotes("");
      setDate(todayStr());
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      setError("Please enter a valid contribution amount greater than ₹0.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit(
        challenge._id,
        {
          amount: num,
          notes: notes.trim(),
          date,
          idempotencyKey: `contrib_${challenge._id}_${date}_${num}_${Date.now()}`,
        }
      );
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to record contribution.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !challenge) return null;

  const remaining = Math.max(0, (challenge.targetAmount || 0) - (challenge.currentAmount || 0));
  const recent = [...(challenge.contributions || [])].reverse().slice(0, 5);

  return (
    <div className="challenge-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="challenge-modal">
        <div className="challenge-modal-header">
          <h2>Record Contribution</h2>
          <button className="challenge-modal-close" onClick={onClose} type="button" aria-label="Close">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="challenge-modal-body">
            {error && <div className="modal-error">{error}</div>}

            <div style={{ background: "#f9f5ff", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px", fontSize: "0.85rem", color: "#4c1d95" }}>
              <strong>{challenge.title}</strong>
              <div style={{ marginTop: "4px", color: "#6b7280", fontSize: "0.8rem" }}>
                Remaining: <strong style={{ color: "#7c3aed" }}>{INR(remaining)}</strong>
                {challenge.suggestedDaily > 0 && (
                  <span style={{ marginLeft: "12px" }}>Suggested daily: <strong>{INR(challenge.suggestedDaily)}</strong></span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contrib-amount">Amount (₹) *</label>
                <input
                  id="contrib-amount"
                  type="number"
                  min="0.01"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g., 500"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="contrib-date">Contribution Date</label>
                <input
                  id="contrib-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="contrib-notes">Notes (Optional)</label>
              <input
                id="contrib-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Monthly savings transfer"
                maxLength={300}
              />
            </div>

            {recent.length > 0 && (
              <div className="contribution-history">
                <h4>Recent Contributions</h4>
                <div className="contribution-history-list">
                  {recent.map((c, i) => (
                    <div key={i} className="contribution-item">
                      <span className="contribution-item-amount">{INR(c.amount)}</span>
                      <span className="contribution-item-meta">
                        {c.notes && <span>{c.notes} · </span>}
                        {fmtDate(c.date)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="challenge-modal-footer">
            <button type="button" className="modal-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-submit-btn" disabled={loading}>
              {loading ? <FiLoader style={{ animation: "spin 0.8s linear infinite" }} /> : null}
              {loading ? " Saving..." : "Record Contribution"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Modal ──────────────────────────────────────────
function DeleteChallengeModal({ isOpen, onClose, onConfirm, challenge }) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !challenge) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(challenge._id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="challenge-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="challenge-modal" style={{ maxWidth: 420 }}>
        <div className="challenge-modal-header">
          <h2>Delete Challenge</h2>
          <button className="challenge-modal-close" onClick={onClose} type="button" aria-label="Close">
            <FiX />
          </button>
        </div>
        <div className="challenge-modal-body">
          <p style={{ color: "#374151", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Are you sure you want to delete <strong>"{challenge.title}"</strong>?
          </p>
          <p style={{ color: "#6b7280", fontSize: "0.82rem", marginTop: "8px", lineHeight: 1.5 }}>
            ⚠️ This will remove the challenge and its contribution history. It will <strong>not</strong> delete any financial transactions in your account.
          </p>
          {challenge.status === "completed" && (
            <p style={{ color: "#7c3aed", fontSize: "0.8rem", marginTop: "8px", background: "#f3eeff", padding: "8px 12px", borderRadius: "8px" }}>
              🏆 Note: Deleting a completed challenge will also remove its achievement history. Milestones cannot be recovered after deletion.
            </p>
          )}
        </div>
        <div className="challenge-modal-footer">
          <button type="button" className="modal-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            style={{
              padding: "10px 24px",
              background: "linear-gradient(135deg, #dc2626, #b91c1c)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "0.88rem",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            {loading ? "Deleting..." : "Delete Challenge"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Milestone Toast ───────────────────────────────────────
function MilestoneToast({ milestones, onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (milestones.length === 0) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 400);
    }, 5000);
    return () => clearTimeout(timer);
  }, [milestones, onDismiss]);

  if (!visible || milestones.length === 0) return null;

  const latest = milestones[milestones.length - 1];

  return (
    <div className="milestone-toast">
      <div className="milestone-toast-emoji">{latest.badge}</div>
      <div className="milestone-toast-content">
        <strong>Milestone Unlocked! 🎉</strong>
        <span>{latest.name}</span>
      </div>
      <button
        type="button"
        onClick={() => { setVisible(false); onDismiss(); }}
        style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", marginLeft: "auto", fontSize: "1.1rem" }}
      >
        <FiX />
      </button>
    </div>
  );
}

// ─── Challenge Card ────────────────────────────────────────
function ChallengeCard({ challenge, onContribute, onEdit, onDelete, onTogglePause }) {
  const target    = Number(challenge.targetAmount)   || 0;
  const current   = Number(challenge.currentAmount)  || 0;
  const remaining = Number(challenge.remainingAmount) ?? Math.max(0, target - current);
  const pct       = Number(challenge.percentage)     || 0;
  const isDone    = challenge.status === "completed";
  const isPaused  = challenge.status === "paused";

  return (
    <div className="challenge-card">
      <div className="challenge-card-header">
        <div className="challenge-card-title-row">
          <div className="challenge-type-icon" title={challenge.type}>
            {TYPE_EMOJI[challenge.type] || "✨"}
          </div>
          <div className="challenge-card-title-group">
            <h3>{challenge.title}</h3>
            <span className="challenge-type-badge">
              {CHALLENGE_TYPES.find((t) => t.value === challenge.type)?.label || challenge.type}
            </span>
          </div>
        </div>
        <span className={`challenge-status-badge ${statusClass(challenge.status)}`}>
          {STATUS_LABELS[challenge.status] || challenge.status}
        </span>
      </div>

      <div className="challenge-card-body">
        {challenge.description && (
          <p className="challenge-desc">{challenge.description}</p>
        )}

        {/* Progress */}
        <div className="challenge-progress-section">
          <div className="challenge-progress-header">
            <div className="challenge-amounts">
              <span className="current">{INR(current)}</span>
              <span className="target">of {INR(target)}</span>
            </div>
            <span className="challenge-pct-badge">{pct}%</span>
          </div>
          <div className="challenge-progress-track">
            <div
              className={`challenge-progress-fill ${progressFillClass(challenge.status)}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>

        {/* Meta chips */}
        <div className="challenge-meta-chips">
          {remaining > 0 && (
            <span className="challenge-meta-chip">
              <FiTarget /> {INR(remaining)} left
            </span>
          )}
          {challenge.daysRemaining > 0 && (
            <span className="challenge-meta-chip">
              <FiClock /> {challenge.daysRemaining}d remaining
            </span>
          )}
          {challenge.suggestedDaily > 0 && !isDone && (
            <span className="challenge-meta-chip">
              <FiTrendingUp /> {INR(challenge.suggestedDaily)}/day
            </span>
          )}
          <span className="challenge-meta-chip">
            <FiCalendar /> Due {fmtDate(challenge.endDate)}
          </span>
        </div>

        {/* Milestones */}
        <div className="challenge-milestones-row">
          <span className="milestone-label">Milestones</span>
          <div className="milestone-badges">
            {(challenge.milestones || []).map((m) => (
              <div
                key={m.threshold}
                className={`milestone-badge ${m.unlocked ? "unlocked" : "locked"}`}
                title={`${m.name}${m.unlockedAt ? ` — Unlocked ${fmtDate(m.unlockedAt)}` : ""}`}
              >
                {m.badge}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="challenge-card-actions">
        {!isDone && (
          <button
            className="challenge-btn primary"
            onClick={() => onContribute(challenge)}
            type="button"
          >
            <FiPlus /> Contribute
          </button>
        )}
        {isDone && (
          <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#059669", fontWeight: 700, fontSize: "0.85rem" }}>
            <FiCheckCircle /> Completed!
          </span>
        )}
        <button className="challenge-btn secondary" onClick={() => onEdit(challenge)} type="button">
          <FiEdit2 /> Edit
        </button>
        {isPaused ? (
          <button className="challenge-btn resume" onClick={() => onTogglePause(challenge, false)} type="button">
            <FiPlay /> Resume
          </button>
        ) : !isDone ? (
          <button className="challenge-btn pause" onClick={() => onTogglePause(challenge, true)} type="button">
            <FiPause /> Pause
          </button>
        ) : null}
        <button className="challenge-btn danger" onClick={() => onDelete(challenge)} type="button">
          <FiTrash2 />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function SavingsChallenges() {
  const { user } = useAuth();
  const [data,           setData]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [activeTab,      setActiveTab]      = useState("active");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals
  const [createOpen,     setCreateOpen]     = useState(false);
  const [editChallenge,  setEditChallenge]  = useState(null);
  const [contributeTarget, setContributeTarget] = useState(null);
  const [deleteTarget,   setDeleteTarget]   = useState(null);

  // Toast
  const [toast, setToast] = useState([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await getChallenges();
      setData(result);
    } catch (err) {
      console.error("Challenges load error:", err);
      setError("Failed to load savings challenges. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered challenges by tab and search query
  const filtered = useMemo(() => {
    if (!data?.challenges) return [];
    let list = data.challenges;
    if (activeTab === "active")    list = list.filter((c) => ["active", "not_started", "paused"].includes(c.status));
    else if (activeTab === "completed") list = list.filter((c) => c.status === "completed");
    else if (activeTab === "overdue")   list = list.filter((c) => c.status === "overdue");

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) =>
        (c.title || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q) ||
        (c.category || "").toLowerCase().includes(q) ||
        (c.challengeType || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, activeTab, searchQuery]);

  const summary = data?.summary;
  const achievements = data?.achievements || [];
  const recommendations = data?.recommendations;

  // ── Handlers ───────────────────────────────────────────
  const handleCreate = async (formData) => {
    await createChallenge(formData);
    await loadData();
  };

  const handleEdit = async (formData) => {
    await updateChallenge(editChallenge._id, formData);
    await loadData();
  };

  const handleContribute = async (challengeId, contribData) => {
    const result = await recordContribution(challengeId, contribData);
    if (result?.newlyUnlockedMilestones?.length > 0) {
      setToast(result.newlyUnlockedMilestones);
    }
    await loadData();
  };

  const handleTogglePause = async (challenge, shouldPause) => {
    try {
      if (shouldPause) {
        await pauseChallenge(challenge._id);
      } else {
        await resumeChallenge(challenge._id);
      }
      await loadData();
    } catch (err) {
      console.error("Pause/resume error:", err);
    }
  };

  const handleDelete = async (challengeId) => {
    await deleteChallenge(challengeId);
    await loadData();
  };

  const counts = {
    active:    (data?.challenges || []).filter((c) => ["active", "not_started", "paused"].includes(c.status)).length,
    completed: (data?.challenges || []).filter((c) => c.status === "completed").length,
    overdue:   (data?.challenges || []).filter((c) => c.status === "overdue").length,
    all:       (data?.challenges || []).length,
  };

  return (
    <div className="dashboard-page challenges-page">
      <Sidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />

      <main className="dashboard-main challenges-main">
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          user={user}
        />

        <div className="dashboard-content challenges-content">

          {/* Header */}
          <div className="challenges-header">
            <div className="challenges-header-text">
              <span className="challenges-tag">
                <FiAward /> SAVINGS CHALLENGES &amp; MILESTONES
              </span>
              <h1>Savings Challenges 🏆</h1>
              <p>Set savings goals, earn milestone badges, and build powerful money habits.</p>
            </div>
            <div className="challenges-header-actions">
              <button className="btn-create-challenge" onClick={() => setCreateOpen(true)} type="button">
                <FiPlus /> Create Challenge
              </button>
            </div>
          </div>

          {/* Loading / Error */}
          {loading && (
            <div className="challenges-loading">
              <div className="challenges-loading-spinner" />
              <p>Loading your challenges...</p>
            </div>
          )}

          {!loading && error && (
            <div className="challenges-error">
              <FiAlertCircle size={32} style={{ marginBottom: 10 }} />
              <h3>Something went wrong</h3>
              <p>{error}</p>
              <button className="btn-create-challenge" onClick={loadData} type="button">
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* Summary stats */}
              <div className="challenges-stats-bar">
                <div className="challenge-stat-card">
                  <div className="challenge-stat-icon purple"><FiZap /></div>
                  <div className="challenge-stat-body">
                    <h3>{summary?.totalActive || 0}</h3>
                    <p>Active</p>
                  </div>
                </div>
                <div className="challenge-stat-card">
                  <div className="challenge-stat-icon green"><FiCheckCircle /></div>
                  <div className="challenge-stat-body">
                    <h3>{summary?.totalCompleted || 0}</h3>
                    <p>Completed</p>
                  </div>
                </div>
                <div className="challenge-stat-card">
                  <div className="challenge-stat-icon blue"><FiDollarSign /></div>
                  <div className="challenge-stat-body">
                    <h3>{INR(summary?.totalContributed || 0)}</h3>
                    <p>Total Contributed</p>
                  </div>
                </div>
                <div className="challenge-stat-card">
                  <div className="challenge-stat-icon amber"><FiAward /></div>
                  <div className="challenge-stat-body">
                    <h3>{summary?.totalMilestonesUnlocked || 0}</h3>
                    <p>Milestones Earned</p>
                  </div>
                </div>
                {summary?.totalOverdue > 0 && (
                  <div className="challenge-stat-card">
                    <div className="challenge-stat-icon red"><FiAlertCircle /></div>
                    <div className="challenge-stat-body">
                      <h3>{summary.totalOverdue}</h3>
                      <p>Overdue</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Overall progress banner */}
              {(summary?.totalChallenges || 0) > 0 && (
                <div className="overall-progress-banner">
                  <div className="overall-progress-text">
                    <h2>Overall Progress</h2>
                    <p>{summary.totalChallenges} challenge{summary.totalChallenges !== 1 ? "s" : ""} · {summary.totalCompleted} completed</p>
                  </div>
                  <div className="overall-progress-bar-wrap">
                    <div className="overall-progress-bar-label">
                      <span>{INR(summary.totalContributed)} saved</span>
                      <span>{summary.overallProgress}%</span>
                    </div>
                    <div className="overall-progress-track">
                      <div
                        className="overall-progress-fill"
                        style={{ width: `${Math.min(100, summary.overallProgress)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Achievements */}
              {achievements.length > 0 && (
                <div className="achievements-section">
                  <div className="achievements-section-header">
                    <h2><FiAward style={{ color: "#f59e0b" }} /> Achievements</h2>
                    <span style={{ fontSize: "0.8rem", color: "#8b9ab0" }}>
                      {achievements.length} milestone{achievements.length !== 1 ? "s" : ""} unlocked
                    </span>
                  </div>
                  <div className="achievements-grid">
                    {achievements.slice(0, 8).map((a, i) => (
                      <div key={i} className="achievement-card">
                        <span className="achievement-emoji">{a.badge}</span>
                        <div className="achievement-info">
                          <h4>{a.name}</h4>
                          <p>{fmtDate(a.unlockedAt)}</p>
                          <div className="achievement-challenge-name">{a.challengeTitle}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="challenges-tabs">
                {[
                  { key: "active",    label: "Active",    icon: <FiZap /> },
                  { key: "completed", label: "Completed",  icon: <FiCheckCircle /> },
                  { key: "overdue",   label: "Overdue",    icon: <FiAlertCircle /> },
                  { key: "all",       label: "All",        icon: <FiFlag /> },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`challenges-tab-btn ${activeTab === tab.key ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.icon}
                    {tab.label}
                    <span className="tab-count">{counts[tab.key]}</span>
                  </button>
                ))}
              </div>

              {/* Cards */}
              <div className="challenges-grid">
                {filtered.length === 0 ? (
                  <div className="challenges-empty">
                    <div className="challenges-empty-icon">
                      {activeTab === "completed" ? <FiCheckCircle /> : <FiTarget />}
                    </div>
                    <h3>
                      {activeTab === "active"    ? "No active challenges" :
                       activeTab === "completed" ? "No completed challenges yet" :
                       activeTab === "overdue"   ? "No overdue challenges" :
                       "No challenges yet"}
                    </h3>
                    <p>
                      {activeTab === "active" || activeTab === "all"
                        ? "Create your first savings challenge and start building better financial habits."
                        : `Complete your active challenges to see them here.`}
                    </p>
                    {(activeTab === "active" || activeTab === "all") && (
                      <button className="btn-create-challenge" onClick={() => setCreateOpen(true)} type="button">
                        <FiPlus /> Create First Challenge
                      </button>
                    )}
                  </div>
                ) : (
                  filtered.map((c) => (
                    <ChallengeCard
                      key={c._id}
                      challenge={c}
                      onContribute={setContributeTarget}
                      onEdit={(ch) => setEditChallenge(ch)}
                      onDelete={setDeleteTarget}
                      onTogglePause={handleTogglePause}
                    />
                  ))
                )}
              </div>

              {/* Recommendations */}
              {recommendations && (
                <div className="recommendations-section">
                  <div className="recommendations-header">
                    <h2><FiStar style={{ color: "#f59e0b" }} /> Personalized Recommendations</h2>
                    <p>
                      {recommendations.hasSufficientData
                        ? "Based on your recent income, expenses, and recurring commitments."
                        : recommendations.reason}
                    </p>
                  </div>

                  {recommendations.hasSufficientData && recommendations.recommendation && (
                    <div className="ai-insight-box">
                      <p>
                        <strong>💡 AI Suggestion:</strong> {recommendations.recommendation.explanation}
                      </p>
                      <p className="ai-disclaimer">{recommendations.recommendation.disclaimer}</p>
                    </div>
                  )}

                  <div className="presets-grid">
                    {(recommendations.presets || []).map((preset) => (
                      <button
                        key={preset.presetId}
                        type="button"
                        className="preset-card"
                        onClick={() => {
                          setCreateOpen(true);
                        }}
                        title="Click to create this challenge"
                      >
                        <span className="preset-tag">{preset.tag}</span>
                        <h4>{preset.title}</h4>
                        <p>{preset.description}</p>
                        <div className="preset-pace">
                          <span className="preset-pace-chip">
                            <FiTrendingUp /> {INR(preset.suggestedDaily)}/day
                          </span>
                          <span className="preset-pace-chip">
                            <FiCalendar /> {preset.durationDays}d
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      <ChallengeModal
        isOpen={createOpen || Boolean(editChallenge)}
        onClose={() => { setCreateOpen(false); setEditChallenge(null); }}
        onSubmit={editChallenge ? handleEdit : handleCreate}
        editingChallenge={editChallenge}
        recommendations={data?.recommendations}
      />

      {/* Contribute Modal */}
      <ContributeModal
        isOpen={Boolean(contributeTarget)}
        onClose={() => setContributeTarget(null)}
        onSubmit={handleContribute}
        challenge={contributeTarget}
      />

      {/* Delete Modal */}
      <DeleteChallengeModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        challenge={deleteTarget}
      />

      {/* Milestone Toast */}
      {toast.length > 0 && (
        <MilestoneToast milestones={toast} onDismiss={() => setToast([])} />
      )}
    </div>
  );
}
