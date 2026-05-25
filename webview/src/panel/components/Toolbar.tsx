import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePanelStore } from "../../shared/store/panel-store";

export function Toolbar() {
  const setFilter = usePanelStore((s) => s.setFilter);
  const filter = usePanelStore((s) => s.filter);
  const commits = usePanelStore((s) => s.commits);
  const currentBranch = usePanelStore((s) => s.currentBranch);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const historyBranch = filter.branch || currentBranch;

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const userBtnRef = useRef<HTMLDivElement>(null);
  const dateBtnRef = useRef<HTMLDivElement>(null);

  // Collect unique authors from commits
  const authors = useMemo(() => {
    const set = new Set<string>();
    for (const c of commits) {
      if (c.authorName) set.add(c.authorName);
    }
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [commits]);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setFilter({ searchQuery: value });
      }, 300);
    },
    [setFilter],
  );

  const handleSelectAuthor = (author: string) => {
    setShowUserDropdown(false);
    setFilter({ author: author === filter.author ? "" : author });
  };

  const handleClearAuthor = () => {
    setShowUserDropdown(false);
    setFilter({ author: "" });
  };

  const handleSelectDate = (range: string) => {
    setShowDateDropdown(false);
    if (range === filter.dateRange) {
      setFilter({ dateRange: "" });
    } else {
      setFilter({ dateRange: range });
    }
  };

  const handleClearDate = () => {
    setShowDateDropdown(false);
    setFilter({ dateRange: "" });
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 8px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}
    >
      <input
        type="text"
        placeholder="Search commits..."
        defaultValue={filter.searchQuery}
        onChange={handleSearch}
        style={{
          width: 180,
          padding: "3px 8px",
          background: "var(--input-bg)",
          color: "var(--input-fg)",
          border: "1px solid var(--input-border)",
          borderRadius: 2,
          fontSize: "var(--font-size)",
          fontFamily: "var(--font-family)",
          outline: "none",
        }}
      />

      <span
        title={historyBranch || "No active branch"}
        style={{
          color: "var(--description-fg)",
          fontSize: "12px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: 160,
        }}
      >
        Branch: {historyBranch || "-"}
      </span>

      {/* User filter */}
      <div style={{ position: "relative" }} ref={userBtnRef}>
        <FilterButton
          label="User"
          active={!!filter.author}
          activeValue={filter.author}
          onClick={() => {
            setShowUserDropdown(!showUserDropdown);
            setShowDateDropdown(false);
          }}
        />
        {showUserDropdown && (
          <FilterDropdown onClose={() => setShowUserDropdown(false)}>
            {filter.author && (
              <DropdownItem
                label="Clear filter"
                active={false}
                onClick={handleClearAuthor}
              />
            )}
            {authors.map((author) => (
              <DropdownItem
                key={author}
                label={author}
                active={author === filter.author}
                onClick={() => handleSelectAuthor(author)}
              />
            ))}
          </FilterDropdown>
        )}
      </div>

      {/* Date filter */}
      <div style={{ position: "relative" }} ref={dateBtnRef}>
        <FilterButton
          label="Date"
          active={!!filter.dateRange}
          activeValue={filter.dateRange}
          onClick={() => {
            setShowDateDropdown(!showDateDropdown);
            setShowUserDropdown(false);
          }}
        />
        {showDateDropdown && (
          <FilterDropdown onClose={() => setShowDateDropdown(false)}>
            {filter.dateRange && (
              <DropdownItem
                label="Clear filter"
                active={false}
                onClick={handleClearDate}
              />
            )}
            <DropdownItem
              label="Today"
              active={filter.dateRange === "today"}
              onClick={() => handleSelectDate("today")}
            />
            <DropdownItem
              label="Last 7 days"
              active={filter.dateRange === "7days"}
              onClick={() => handleSelectDate("7days")}
            />
            <DropdownItem
              label="Last 30 days"
              active={filter.dateRange === "30days"}
              onClick={() => handleSelectDate("30days")}
            />
            <DropdownItem
              label="Last 90 days"
              active={filter.dateRange === "90days"}
              onClick={() => handleSelectDate("90days")}
            />
          </FilterDropdown>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FilterButton({
  label,
  active,
  activeValue,
  onClick,
}: {
  label: string;
  active: boolean;
  activeValue?: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "2px 8px",
        fontSize: "12px",
        cursor: "pointer",
        borderRadius: 3,
        border: active
          ? "1px solid var(--vscode-focusBorder, #007fd4)"
          : "1px solid transparent",
        color: active
          ? "var(--vscode-textLink-foreground, #3794ff)"
          : "var(--description-fg)",
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
    >
      {label}
      {active && activeValue ? `: ${activeValue}` : " ▾"}
    </div>
  );
}

function FilterDropdown({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleMouseDown, true);
    return () =>
      document.removeEventListener("mousedown", handleMouseDown, true);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        marginTop: 4,
        zIndex: 9999,
        background: "var(--vscode-menu-background, #252526)",
        border: "1px solid var(--vscode-menu-border, #454545)",
        borderRadius: 4,
        padding: "4px 0",
        minWidth: 140,
        maxHeight: 200,
        overflowY: "auto",
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
      }}
    >
      {children}
    </div>
  );
}

function DropdownItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "5px 12px",
        fontSize: "12px",
        cursor: "pointer",
        color: active
          ? "var(--vscode-menu-selectionForeground, #fff)"
          : "var(--vscode-menu-foreground, #ccc)",
        background: active
          ? "var(--vscode-menu-selectionBackground, #094771)"
          : "transparent",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background =
            "var(--vscode-menu-selectionBackground, #094771)";
          (e.currentTarget as HTMLElement).style.color =
            "var(--vscode-menu-selectionForeground, #fff)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color =
            "var(--vscode-menu-foreground, #ccc)";
        }
      }}
    >
      {label}
    </div>
  );
}
