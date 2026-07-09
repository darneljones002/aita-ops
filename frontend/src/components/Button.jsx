export default function Button({ children, type = "submit", onClick }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="rounded bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800"
    >
      {children}
    </button>
  );
}