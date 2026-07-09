import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/parents", label: "Parents" },
  { to: "/athletes", label: "Athletes" },
  { to: "/sessions", label: "Sessions" },
  { to: "/invites", label: "Invites" },
  { to: "/message-templates", label: "Templates" },
  { to: "/message-logs", label: "Logs" },
  { to: "/tags", label: "Tags" },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              A.I. Training Academy Ops
            </h1>
            <p className="text-sm text-slate-600">
              CRM, sessions, RSVP tracking, and parent communication.
            </p>
          </div>

          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-blue-700 text-white"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6">
        <Outlet />
      </main>
    </div>
  );
}