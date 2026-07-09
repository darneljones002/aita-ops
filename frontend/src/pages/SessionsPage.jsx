import { useEffect, useState } from "react";
import { api } from "../api/client";
import Card from "../components/Card";
import Input from "../components/Input";
import Select from "../components/Select";
import Button from "../components/Button";

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({
    title: "",
    location: "",
    start_time: "",
    end_time: "",
    capacity: 12,
    session_type: "academy",
  });

  const loadSessions = async () => {
    const res = await api.get("/sessions/");
    setSessions(res.data);
  };

  function formatLocalDateTime(value) {
  if (!value) return "";

  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-");
  const [hour, minute] = timePart.split(":");

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  );

  return date.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

  useEffect(() => {
    loadSessions();
  }, []);

  const createSession = async (e) => {
    e.preventDefault();
    await api.post("/sessions/", {
      ...form,
      capacity: Number(form.capacity),
      start_time: form.start_time,
      end_time: form.end_time,
    });

    setForm({
      title: "",
      location: "",
      start_time: "",
      end_time: "",
      capacity: 12,
      session_type: "academy",
    });

    loadSessions();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card title="Create Session">
        <form onSubmit={createSession} className="space-y-3">
          <Input label="Title" required value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <Input label="Location" required value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          <Input type="datetime-local" label="Start Time" required value={form.start_time} onChange={(v) => setForm({ ...form, start_time: v })} />
          <Input type="datetime-local" label="End Time" required value={form.end_time} onChange={(v) => setForm({ ...form, end_time: v })} />
          <Input type="number" label="Capacity" value={form.capacity} onChange={(v) => setForm({ ...form, capacity: v })} />

          <Select
            label="Session Type"
            value={form.session_type}
            onChange={(v) => setForm({ ...form, session_type: v })}
            options={["academy", "evaluation", "pod", "clinic"]}
          />

          <Button>Create Session</Button>
        </form>
      </Card>

      <Card title="Sessions">
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="rounded border p-3">
              <p className="font-semibold">{s.title}</p>
              <p className="text-sm text-slate-600">{s.location}</p>
              <p className="text-sm text-slate-600">
                {formatLocalDateTime(s.start_time)}
              </p>
              <p className="text-sm text-slate-600">Capacity: {s.capacity}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}