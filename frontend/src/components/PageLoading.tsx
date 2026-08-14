interface PageLoadingProps {
  label?: string;
}

export function PageLoading({ label = 'Loading task...' }: PageLoadingProps) {
  return (
    <div className="page-centered">
      <div className="page-loading" role="status">
        <span className="button-spinner page-loading-spinner" aria-hidden="true" />
        {label}
      </div>
    </div>
  );
}