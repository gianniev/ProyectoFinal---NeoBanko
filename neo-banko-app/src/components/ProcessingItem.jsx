import Spinner from "./Spinner";

function ProcessingItem({ amount, title }) {
  return (
    <div className="processing-item" role="status" aria-live="polite">
      <span className="processing-item-media">
        <Spinner className="spinner-small" />
      </span>
      <span className="processing-item-title">{title}</span>
      {amount ? <span className="processing-item-amount">{amount}</span> : null}
    </div>
  );
}

export default ProcessingItem;
