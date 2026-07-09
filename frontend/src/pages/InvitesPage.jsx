import { useEffect, useState } from "react";
import { api } from "../api/client";
import Card from "../components/Card";
import Select from "../components/Select";
import Textarea from "../components/Textarea";
import Button from "../components/Button";

export default function InvitesPage() {
  const [athletes, setAthletes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [invites, setInvites] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [activeInvite, setActiveInvite] = useState(null);
  const [sendStatus, setSendStatus] = useState("");
  const [emailSubject, setEmailSubject] = useState("A.I. Training Academy Session Confirmation");

  const [tags, setTags] = useState([]);
  const [bulkSessionId, setBulkSessionId] = useState("");
  const [bulkTagId, setBulkTagId] = useState("");
  const [bulkResult, setBulkResult] = useState("");

  const [form, setForm] = useState({
    athlete_id: "",
    session_id: "",
    status: "invited",
    notes: "",
  });

  const loadData = async () => {
    const [athletesRes, sessionsRes, invitesRes, templatesRes, tagsRes] =
      await Promise.all([
        api.get("/athletes/"),
        api.get("/sessions/"),
        api.get("/invites/"),
        api.get("/message-templates/"),
        api.get("/tags/"),
      ]);

    setAthletes(athletesRes.data);
    setSessions(sessionsRes.data);
    setInvites(invitesRes.data);
    setTemplates(templatesRes.data);
    setTags(tagsRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const createInvite = async (e) => {
    e.preventDefault();

    await api.post("/invites/", {
      ...form,
      athlete_id: Number(form.athlete_id),
      session_id: Number(form.session_id),
    });

    setForm({
      athlete_id: "",
      session_id: "",
      status: "invited",
      notes: "",
    });

    loadData();
  };

  const updateInviteStatus = async (inviteId, status) => {
    await api.patch(`/invites/${inviteId}`, { status });
    loadData();
  };

  const athleteName = (id) => {
    const athlete = athletes.find((a) => a.id === id);
    return athlete ? `${athlete.first_name} ${athlete.last_name || ""}` : "";
  };

  const sessionName = (id) => {
    const session = sessions.find((s) => s.id === id);
    return session ? `${session.title} - ${session.location}` : "";
  };

  const getAthlete = (id) => athletes.find((a) => a.id === id);

  const renderTemplate = async (invite) => {
    if (!selectedTemplateId) {
      alert("Select a template first.");
      return;
    }

    const res = await api.post("/message-templates/render", {
      template_id: Number(selectedTemplateId),
      athlete_id: invite.athlete_id,
      session_id: invite.session_id,
    });

    setGeneratedMessage(res.data.message);
    setActiveInvite(invite);
    setSendStatus("");
  };

  const copyMessage = async () => {
    await navigator.clipboard.writeText(generatedMessage);
    setSendStatus("Message copied.");
  };

  const sendEmail = async () => {
  if (!activeInvite || !generatedMessage) return;

  const athlete = getAthlete(activeInvite.athlete_id);

  if (!athlete?.parent_id) {
    alert("Athlete does not have a parent assigned.");
    return;
  }

  const res = await api.post("/message-templates/send-email", {
        parent_id: athlete.parent_id,
        athlete_id: activeInvite.athlete_id,
        session_id: activeInvite.session_id,
        subject: emailSubject,
        body: generatedMessage,
        message_type: "session_email",
      });

      setSendStatus(`Email status: ${res.data.status}`);
    };

  const sendSms = async () => {
    if (!activeInvite || !generatedMessage) return;

    const athlete = getAthlete(activeInvite.athlete_id);

    if (!athlete?.parent_id) {
      alert("Athlete does not have a parent assigned.");
      return;
    }

    const res = await api.post("/message-templates/send-sms", {
      parent_id: athlete.parent_id,
      athlete_id: activeInvite.athlete_id,
      session_id: activeInvite.session_id,
      body: generatedMessage,
      message_type: "session_reminder",
    });

    setSendStatus(`SMS status: ${res.data.status}`);
  };

  const bulkInviteByTag = async (e) => {
    e.preventDefault();

    const res = await api.post(
      `/sessions/${bulkSessionId}/bulk-invite-by-tag`,
      {
        tag_ids: [Number(bulkTagId)],
        status: "invited",
        skip_existing: true,
      }
    );

    setBulkResult(
      `Created ${res.data.created} invites. Skipped ${res.data.skipped}.`
    );

    await loadData();
  };

  return (
    <div className="space-y-6">
      <Card title="Invite Athlete">
        <form onSubmit={createInvite} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Select
            label="Athlete"
            value={form.athlete_id}
            onChange={(v) => setForm({ ...form, athlete_id: v })}
            options={athletes.map((a) => ({
              value: a.id,
              label: `${a.first_name} ${a.last_name || ""}`,
            }))}
          />

          <Select
            label="Session"
            value={form.session_id}
            onChange={(v) => setForm({ ...form, session_id: v })}
            options={sessions.map((s) => ({
              value: s.id,
              label: `${s.title} - ${s.location}`,
            }))}
          />

          <Select
            label="Status"
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v })}
            options={[
              "invited",
              "confirmed",
              "declined",
              "no_response",
              "attended",
              "no_show",
            ]}
          />

          <input
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            className="mb-3 w-full rounded border border-slate-300 px-3 py-2"
            placeholder="Email subject"
          />

          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(v) => setForm({ ...form, notes: v })}
          />

          <div className="md:col-span-2">
            <Button>Create Invite</Button>
          </div>
        </form>
      </Card>

      <Card title="Bulk Invite by Tag">
        <form onSubmit={bulkInviteByTag} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Select
            label="Session"
            value={bulkSessionId}
            onChange={setBulkSessionId}
            options={sessions.map((session) => ({
              value: session.id,
              label: `${session.title} - ${session.location}`,
            }))}
          />

          <Select
            label="Tag"
            value={bulkTagId}
            onChange={setBulkTagId}
            options={tags.map((tag) => ({
              value: tag.id,
              label: tag.name,
            }))}
          />

          <div className="md:col-span-2">
            <Button>Create Bulk Invites</Button>
          </div>
        </form>

        {bulkResult && (
          <p className="mt-3 rounded bg-slate-100 p-3 text-sm text-slate-700">
            {bulkResult}
          </p>
        )}
      </Card>

      <Card title="Template Selector">
        <Select
          label="Message Template"
          value={selectedTemplateId}
          onChange={setSelectedTemplateId}
          options={templates
            .filter((t) => t.channel === "sms")
            .map((t) => ({
              value: t.id,
              label: t.name,
            }))}
        />
      </Card>

      <Card title="RSVP Dashboard">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                <th className="p-3">Athlete</th>
                <th className="p-3">Session</th>
                <th className="p-3">Status</th>
                <th className="p-3">RSVP</th>
                <th className="p-3">Message</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <tr key={invite.id} className="border-b align-top">
                  <td className="p-3">{athleteName(invite.athlete_id)}</td>
                  <td className="p-3">{sessionName(invite.session_id)}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium">
                      {invite.status}
                    </span>
                  </td>
                  <td className="flex flex-wrap gap-2 p-3">
                    {["confirmed", "declined", "attended", "no_show"].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => updateInviteStatus(invite.id, status)}
                          className="rounded bg-slate-900 px-3 py-1 text-xs text-white"
                        >
                          {status}
                        </button>
                      )
                    )}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => renderTemplate(invite)}
                      className="rounded bg-blue-700 px-3 py-1 text-xs text-white"
                    >
                      Render Template
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {generatedMessage && (
        <Card title="Generated Message">
          <textarea
            value={generatedMessage}
            onChange={(e) => setGeneratedMessage(e.target.value)}
            className="h-56 w-full rounded border border-slate-300 p-3"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" onClick={copyMessage}>
              Copy Message
            </Button>

            <button
              type="button"
              onClick={sendSms}
              className="rounded bg-green-700 px-4 py-2 font-medium text-white hover:bg-green-800"
            >
              Send SMS
            </button>

            <button
              type="button"
              onClick={sendEmail}
              className="rounded bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800"
            >
              Send Email
            </button>
          </div>

          {sendStatus && (
            <p className="mt-3 rounded bg-slate-100 p-3 text-sm text-slate-700">
              {sendStatus}
            </p>
          )}

          <p className="mt-3 text-xs text-slate-500">
            SMS is currently controlled by your backend SMS_DRY_RUN setting.
          </p>
        </Card>
      )}
    </div>
  );
}