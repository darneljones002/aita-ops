export default function Card({ title, children }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      {title && <h2 className="mb-4 text-xl font-semibold">{title}</h2>}
      {children}
    </div>
  );
}