import { LoaderIcon } from "lucide-react";

function Spinner({ className = "", ...props }) {
  return (
    <LoaderIcon
      aria-label="Loading"
      className={`spinner ${className}`.trim()}
      role="status"
      {...props}
    />
  );
}

export function SpinnerCustom() {
  return (
    <div className="spinner-wrap">
      <Spinner />
    </div>
  );
}

export default Spinner;
