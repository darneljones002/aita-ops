import { useEffect, useState } from "react";
import { api } from "../api/client";
import Card from "../components/Card";
import Input from "../components/Input";
import Select from "../components/Select";
import Textarea from "../components/Textarea";
import Button from "../components/Button";

export default function MessageTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({
    name: "",
    channel: "sms",
    body: "",
  });

  const loadTemplates = async () => {
    const res = await api.get("/message-templates/");
    setTemplates(res.data);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const createTemplate = async (e) => {
    e.preventDefault();

    await api.post("/message-templates/", form);

    setForm({
      name: "",
      channel: "sms",
      body: "",
    });

    loadTemplates();
  };

  const seedEmailConfirmationTemplate = () => {
    setForm({
      name: "Email Session Confirmation",
      channel: "email",
      body:
        "Hi {{parent_first_name}},\n\nThis is a confirmation for {{athlete_first_name}}'s upcoming session.\n\nSession: {{session_title}}\nLocation: {{session_location}}\nTime: {{session_start_time}}\n\nPlease reply if anything changes.\n\n{{coach_name}}\nA.I. Training Academy",
    });
  };

  const seedConfirmationTemplate = () => {
    setForm({
      name: "Session Confirmation",
      channel: "sms",
      body:
        "Hi {{parent_first_name}}, just confirming {{athlete_first_name}} for {{session_title}} at {{session_location}} on {{session_start_time}}. Please reply CONFIRMED to hold the spot. - {{coach_name}}",
    });
  };

  const seedDayOfTemplate = () => {
    setForm({
      name: "Day-Of Reminder",
      channel: "sms",
      body:
        "Good morning {{parent_first_name}}, just a reminder that {{athlete_first_name}} is scheduled for {{session_title}} today at {{session_location}} on {{session_start_time}}. Please arrive 10 minutes early with water and a basketball. - {{coach_name}}",
    });
  };

  const seedNoShowTemplate = () => {
    setForm({
      name: "No-Show Follow-Up",
      channel: "sms",
      body:
        "Hi {{parent_first_name}}, we missed {{athlete_first_name}} at today's session. We had a spot held, so I just wanted to check in and make sure everything is okay. - {{coach_name}}",
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card title="Create Message Template">
        <form onSubmit={createTemplate} className="space-y-3">
          <Input
            label="Template Name"
            required
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
          />

          <Select
            label="Channel"
            value={form.channel}
            onChange={(v) => setForm({ ...form, channel: v })}
            options={["sms", "email"]}
          />

          <Textarea
            label="Body"
            value={form.body}
            onChange={(v) => setForm({ ...form, body: v })}
          />

          <div className="flex flex-wrap gap-2">
            <Button type="submit">Save Template</Button>
            <button
              type="button"
              onClick={seedEmailConfirmationTemplate}
              className="rounded bg-purple-700 px-4 py-2 text-sm font-medium text-white"
            >
              Use Email Confirmation
            </button>
            <button
              type="button"
              onClick={seedConfirmationTemplate}
              className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white"
            >
              Use Confirmation
            </button>
            <button
              type="button"
              onClick={seedDayOfTemplate}
              className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white"
            >
              Use Day-Of
            </button>
            <button
              type="button"
              onClick={seedNoShowTemplate}
              className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white"
            >
              Use No-Show
            </button>
          </div>
        </form>

        <div className="mt-5 rounded bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold">Available variables:</p>
          <p>{"{{parent_first_name}}"}</p>
          <p>{"{{athlete_first_name}}"}</p>
          <p>{"{{athlete_last_name}}"}</p>
          <p>{"{{session_title}}"}</p>
          <p>{"{{session_location}}"}</p>
          <p>{"{{session_start_time}}"}</p>
          <p>{"{{coach_name}}"}</p>
          <p>{"{{academy_name}}"}</p>
        </div>
      </Card>

      <Card title="Saved Templates">
        <div className="space-y-3">
          {templates.map((template) => (
            <div key={template.id} className="rounded border p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold">{template.name}</p>
                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs">
                  {template.channel}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {template.body}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}