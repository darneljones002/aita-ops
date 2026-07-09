import { useEffect, useState } from "react";
import { api } from "../api/client";
import Card from "../components/Card";
import Input from "../components/Input";
import Select from "../components/Select";
import Textarea from "../components/Textarea";
import Button from "../components/Button";

export default function AthletesPage() {
  const [parents, setParents] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    grade: "",
    graduation_year: "",
    status: "lead",
    preferred_location: "",
    notes: "",
    parent_id: "",
  });

  const loadData = async () => {
    const [parentsRes, athletesRes] = await Promise.all([
      api.get("/parents/"),
      api.get("/athletes/"),
    ]);
    setParents(parentsRes.data);
    setAthletes(athletesRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const createAthlete = async (e) => {
    e.preventDefault();
    await api.post("/athletes/", {
      ...form,
      parent_id: Number(form.parent_id),
    });

    setForm({
      first_name: "",
      last_name: "",
      grade: "",
      graduation_year: "",
      status: "lead",
      preferred_location: "",
      notes: "",
      parent_id: "",
    });

    loadData();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card title="Add Athlete">
        <form onSubmit={createAthlete} className="space-y-3">
          <Input label="First Name" required value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} />
          <Input label="Last Name" value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} />
          <Input label="Grade" value={form.grade} onChange={(v) => setForm({ ...form, grade: v })} />
          <Input label="Graduation Year" value={form.graduation_year} onChange={(v) => setForm({ ...form, graduation_year: v })} />
          <Input label="Preferred Location" value={form.preferred_location} onChange={(v) => setForm({ ...form, preferred_location: v })} />

          <Select
            label="Status"
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v })}
            options={["lead", "evaluation", "enrolled", "waitlist", "inactive"]}
          />

          <Select
            label="Parent"
            value={form.parent_id}
            onChange={(v) => setForm({ ...form, parent_id: v })}
            options={parents.map((p) => ({
              value: p.id,
              label: `${p.first_name} ${p.last_name || ""}`,
            }))}
          />

          <Textarea label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
          <Button>Add Athlete</Button>
        </form>
      </Card>

      <Card title="Athletes">
        <div className="space-y-3">
          {athletes.map((a) => (
            <div key={a.id} className="rounded border p-3">
              <p className="font-semibold">{a.first_name} {a.last_name}</p>
              <p className="text-sm text-slate-600">Status: {a.status}</p>
              <p className="text-sm text-slate-600">Location: {a.preferred_location}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}