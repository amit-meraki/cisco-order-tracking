export default function Toast({ toast }) {
  return (
    <div
      className={`toast ${toast.show ? "show" : ""} ${toast.type}`}
      role="status"
      aria-live="polite"
    >
      {toast.message}
    </div>
  );
}
