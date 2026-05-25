import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useRef, useState } from "react";
import { useModifierClickSelection } from "../../shared/hooks/useModifierClickSelection";
import { usePanelStore } from "../../shared/store/panel-store";
import type { Commit } from "../../shared/types/git";
import { CommitContextMenu } from "./CommitContextMenu";
import { type ColumnWidths, CommitRow, ROW_HEIGHT } from "./CommitRow";

const COLUMN_WIDTH = 16;
const GRAPH_PADDING = 8;

const DEFAULT_COLUMN_WIDTHS: ColumnWidths = {
  author: 100,
  date: 130,
};

export function CommitList({
  onScroll,
}: {
  onScroll?: (scrollTop: number) => void;
}) {
  const visibleCommits = usePanelStore((s) => s.visibleCommits);
  const graphLayout = usePanelStore((s) => s.graphLayout);
  const hasMore = usePanelStore((s) => s.hasMore);
  const loadMore = usePanelStore((s) => s.loadMore);
  const loading = usePanelStore((s) => s.loading);
  const selectCommit = usePanelStore((s) => s.selectCommit);

  const parentRef = useRef<HTMLDivElement>(null);
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(
    DEFAULT_COLUMN_WIDTHS,
  );

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    commit: Commit;
  } | null>(null);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, commit: Commit) => {
      setContextMenu({ x: e.clientX, y: e.clientY, commit });
    },
    [],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const maxColumn = Math.max(
    0,
    ...Object.values(graphLayout).map((l) => l.column),
  );
  const graphWidth = (maxColumn + 1) * COLUMN_WIDTH + GRAPH_PADDING * 2;

  const virtualizer = useVirtualizer({
    count: visibleCommits.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });
  const allVisibleCommitHashes = visibleCommits.map((commit) => commit.hash);

  const handleCommitClick = useModifierClickSelection<string>((hash, mode) => {
    void selectCommit(hash, mode, allVisibleCommitHashes);
  });

  const handleScroll = useCallback(() => {
    const el = parentRef.current;
    if (!el) return;
    onScroll?.(el.scrollTop);
    if (
      !loading &&
      hasMore &&
      el.scrollTop + el.clientHeight >= el.scrollHeight - ROW_HEIGHT * 5
    ) {
      loadMore();
    }
  }, [onScroll, loading, hasMore, loadMore]);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleResizeAuthor = useCallback((delta: number) => {
    setColumnWidths((prev) => ({
      ...prev,
      author: Math.max(40, prev.author + delta),
    }));
  }, []);

  const handleResizeDate = useCallback((delta: number) => {
    setColumnWidths((prev) => ({
      ...prev,
      date: Math.max(60, prev.date + delta),
    }));
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
      }}
    >
      {/* Column header with resize handles */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 24,
          paddingLeft: graphWidth,
          paddingRight: 8,
          borderBottom: "1px solid var(--border, #333)",
          fontSize: "11px",
          opacity: 0.6,
          flexShrink: 0,
          userSelect: "none",
        }}
      >
        <span style={{ flex: 1, paddingRight: 8 }}>Message</span>
        <ResizeHandle onResize={handleResizeAuthor} />
        <span
          style={{
            flexShrink: 0,
            width: columnWidths.author,
            paddingLeft: 8,
          }}
        >
          Author
        </span>
        <ResizeHandle onResize={handleResizeDate} />
        <span
          style={{
            flexShrink: 0,
            width: columnWidths.date,
            textAlign: "right",
            paddingLeft: 8,
          }}
        >
          Date
        </span>
      </div>

      {/* Scrollable commit list */}
      <div
        ref={parentRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          position: "relative",
        }}
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((item) => {
            const commit = visibleCommits[item.index];
            const lane = graphLayout[commit.hash];
            return (
              <div
                key={commit.hash}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: ROW_HEIGHT,
                  transform: `translateY(${item.start}px)`,
                }}
              >
                <CommitRow
                  commit={commit}
                  lane={lane}
                  graphWidth={graphWidth}
                  columnWidths={columnWidths}
                  onCommitClick={handleCommitClick}
                  onContextMenu={handleContextMenu}
                />
              </div>
            );
          })}
        </div>
        {contextMenu && (
          <CommitContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            commit={contextMenu.commit}
            onClose={closeContextMenu}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ResizeHandle – draggable column separator
// ---------------------------------------------------------------------------

function ResizeHandle({ onResize }: { onResize: (delta: number) => void }) {
  const handleRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      let lastX = e.clientX;
      setDragging(true);

      const handleMouseMove = (ev: MouseEvent) => {
        const delta = ev.clientX - lastX;
        lastX = ev.clientX;
        if (delta !== 0) {
          onResize(delta);
        }
      };

      const handleMouseUp = () => {
        setDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [onResize],
  );

  return (
    <div
      ref={handleRef}
      onMouseDown={handleMouseDown}
      style={{
        width: 5,
        cursor: "col-resize",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 1,
          height: "60%",
          background: dragging
            ? "var(--vscode-focusBorder, #007fd4)"
            : "var(--border, #333)",
        }}
      />
    </div>
  );
}
