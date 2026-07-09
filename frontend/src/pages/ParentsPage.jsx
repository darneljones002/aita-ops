import { useEffect, useState } from "react";
import { api } from "../api/client";
import Card from "../components/Card";
import Input from "../components/Input";
import Select from "../components/Select";
import Button from "../components/Button";

export default function ParentsPage() {
  const [parents, setParents] = useState([]);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    sms_consent_status: "not_requested",
    sms_consent_source: "manual_import",
    email_consent_status: "subscribed",
  });

  const loadParents = async () => {
    const res = await api.get("/parents/");
    setParents(res.data);
  };

  useEffect(() => {
    loadParents();
  }, []);

  const createParent = async (e) => {
    e.preventDefault();

    await api.post("/parents/", form);

    setForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      sms_consent_status: "not_requested",
      sms_consent_source: "manual_import",
      email_consent_status: "subscribed",
    });

    loadParents();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card title="Add Parent">
        <form onSubmit={createParent} className="space-y-3">
          <Input
            label="First Name"
            required
            value={form.first_name}
            onChange={(v) => setForm({ ...form, first_name: v })}
          />

          <Input
            label="Last Name"
            value={form.last_name}
            onChange={(v) => setForm({ ...form, last_name: v })}
          />

          <Input
            label="Email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
          />

          <Input
            label="Phone"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
          />

          <Select
            label="SMS Consent Status"
            value={form.sms_consent_status}
            onChange={(v) => setForm({ ...form, sms_consent_status: v })}
            options={["not_requested", "opted_in", "opted_out"]}
          />

          <Select
            label="Email Consent Status"
            value={form.email_consent_status}
            onChange={(v) => setForm({ ...form, email_consent_status: v })}
            options={["subscribed", "unsubscribed"]}
          />

          <Select
            label="SMS Consent Source"
            value={form.sms_consent_source}
            onChange={(v) => setForm({ ...form, sms_consent_source: v })}
            options={[
              "registration_form",
              "manual_import",
              "text_reply",
              "parent_portal",
            ]}
          />

          <Button>Add Parent</Button>
        </form>
      </Card>

      <Card title="Parents">
        <div className="space-y-3">
          {parents.map((p) => (
            <div key={p.id} className="rounded border p-3">
              <p className="font-semibold">
                {p.first_name} {p.last_name}
              </p>
              <p className="text-sm text-slate-600">Email: {p.email || "—"}</p>
              <p className="text-sm text-slate-600">Phone: {p.phone || "—"}</p>
              <p className="text-sm text-slate-600">
                Normalized: {p.phone_normalized || "—"}
              </p>
              <p className="text-sm text-slate-600">
                Phone Valid: {p.phone_valid}
              </p>
              <p className="text-sm text-slate-600">
                SMS Consent: {p.sms_consent_status}
              </p>
              <p className="text-sm text-slate-600">
                Email Consent: {p.email_consent_status}
              </p>
              <p className="text-sm text-slate-600">
                Consent Source: {p.sms_consent_source || "—"}
              </p>
            </div>
          ))}

          {parents.length === 0 && (
            <p className="text-sm text-slate-500">No parents yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}