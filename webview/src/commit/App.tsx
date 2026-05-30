import { useCallback, useEffect, useState } from "react";
import { bridge } from "../shared/bridge";
import { useCommitStore } from "../shared/store/commit-store";
import { CommitTab } from "./components/CommitTab";
import { IdeaShelfTab } from "./components/IdeaShelfTab";
import { ShelfTab } from "./components/ShelfTab";
import "./commit.css";

function ProgressBar({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="commit-progress-bar">
      <div className="commit-progress-bar-inner" />
    </div>
  );
}

interface RebaseState {
  isRebasing: boolean;
  branchName?: string;
  step?: number;
  totalSteps?: number;
}

function RebaseBanner() {
  const [state, setState] = useState<RebaseState>({ isRebasing: false });
  const [loading, setLoading] = useState(false);

  const fetchState = useCallback(async () => {
    try {
      const result = (await bridge.request("getRebaseState")) as RebaseState;
      setState(result);
    } catch {
      setState({ isRebasing: false });
    }
  }, []);

  useEffect(() => {
    fetchState();
    const unsub = bridge.onEvent((event) => {
      if (event === "gitStateChanged" || event === "commitStateChanged") {
        fetchState();
      }
    });
    return unsub;
  }, [fetchState]);

  const handleAction = useCallback(
    async (action: "continue" | "abort" | "skip") => {
      setLoading(true);
      try {
        await bridge.request("rebaseAction", { action });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        bridge
          .request("showErrorNotification", { message: msg })
          .catch(() => {});
      } finally {
        setLoading(false);
        fetchState();
      }
    },
    [fetchState],
  );

  if (!state.isRebasing) return null;

  const label = state.branchName ? `Rebasing ${state.branchName}` : "Rebasing";
  const progress =
    state.step && state.totalSteps
      ? ` (${state.step}/${state.totalSteps})`
      : "";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        background: "#e8f5e9",
        borderBottom: "1px solid #c8e6c9",
        fontSize: 12,
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 14 }}>⚠️</span>
      <span style={{ fontWeight: 600, flex: 1, color: "#333" }}>
        {label}
        {progress}
      </span>
      <div
        role="button"
        tabIndex={0}
        aria-disabled={loading}
        onClick={() => !loading && handleAction("continue")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!loading) handleAction("continue");
          }
        }}
        className="rebase-action-btn rebase-continue"
        title="Continue Rebase (git rebase --continue)"
      >
        {/* JetBrains official expui double chevron >> icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.5 11.5L6 8L2.5 4.5"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.5 11.5L12 8L8.5 4.5"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div
        role="button"
        tabIndex={0}
        aria-disabled={loading}
        onClick={() => !loading && handleAction("abort")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!loading) handleAction("abort");
          }
        }}
        className="rebase-action-btn rebase-abort"
        title="Abort Rebase (git rebase --abort)"
      >
        {/* JetBrains official expui/vcs/abort × icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 12L12 4M12 12L4 4"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

export function CommitApp() {
  const {
    activeTab,
    setActiveTab,
    loading,
    fetchChanges,
    fetchShelves,
    fetchIdeaShelves,
  } = useCommitStore();

  useEffect(() => {
    fetchChanges();
    fetchShelves();
    fetchIdeaShelves();
  }, [fetchChanges, fetchShelves, fetchIdeaShelves]);

  return (
    <div className="commit-app">
      <div className="commit-tabs">
        <button
          type="button"
          className={`commit-tab ${activeTab === "commit" ? "active" : ""}`}
          onClick={() => setActiveTab("commit")}
        >
          Commit
        </button>
        <button
          type="button"
          className={`commit-tab ${activeTab === "shelf" ? "active" : ""}`}
          onClick={() => setActiveTab("shelf")}
        >
          Shelf
        </button>
        <button
          type="button"
          className={`commit-tab ${activeTab === "stash" ? "active" : ""}`}
          onClick={() => setActiveTab("stash")}
        >
          Stash
        </button>
      </div>
      <RebaseBanner />
      <ProgressBar visible={loading} />
      <div className="commit-content">
        {activeTab === "commit" && <CommitTab />}
        {activeTab === "shelf" && <IdeaShelfTab />}
        {activeTab === "stash" && <ShelfTab />}
      </div>
    </div>
  );
}
