function Skeleton({ className = "" }) {
  return <span aria-hidden="true" className={`skeleton ${className}`.trim()} />;
}

export default Skeleton;
