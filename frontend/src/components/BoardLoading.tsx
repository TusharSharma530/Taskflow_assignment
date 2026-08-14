/**
 * Skeleton screen shown while the board loads, mimicking the column layout
 * so the transition to real data feels seamless.
 */
export function BoardLoading({ columnCount = 3 }: { columnCount?: number }) {
  return (
    <div className="board board-loading" aria-label="Loading board" aria-busy="true">
      {Array.from({ length: columnCount }).map((_, columnIndex) => (
        <div key={columnIndex} className="column">
          <div className="skeleton skeleton-title" style={{ width: '40%' }} />
          <div className="skeleton-tasks">
            {Array.from({ length: columnIndex + 2 }).map((__, taskIndex) => (
              <div key={taskIndex} className="skeleton-card">
                <div className="skeleton skeleton-line" style={{ width: '70%' }} />
                <div className="skeleton skeleton-line" style={{ width: '45%' }} />
                <div className="skeleton skeleton-line" style={{ width: '30%' }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}