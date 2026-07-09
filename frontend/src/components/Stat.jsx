export default function Stat({ title, value }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}