import { useEffect, useState } from "react";
import { api } from "../api/client";
import Card from "../components/Card";
import Input from "../components/Input";
import Textarea from "../components/Textarea";
import Select from "../components/Select";
import Button from "../components/Button";

export default function TagsPage() {
  const [tags, setTags] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [selectedTagId, setSelectedTagId] = useState("");
  const [selectedAthleteId, setSelectedAthleteId] = useState("");
  const [tagAthletes, setTagAthletes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [bulkMessage, setBulkMessage] = useState({
        tag_id: "",
        template_id: "",
        session_id: "",
        channel: "sms",
        subject: "",
      });
  const [bulkSendResult, setBulkSendResult] = useState(null);
  const [bulkPreviewResult, setBulkPreviewResult] = useState(null);
  const [bulkPreviewError, setBulkPreviewError] = useState("");

  const [form, setForm] = useState({
    name: "",
    color: "",
    description: "",
  });

  const loadData = async () => {
    const [tagsRes, athletesRes, templatesRes, sessionsRes] = await Promise.all([
      api.get("/tags/"),
      api.get("/athletes/"),
      api.get("/message-templates/"),
      api.get("/sessions/"),
    ]);

    setTags(tagsRes.data);
    setAthletes(athletesRes.data);
    setTemplates(templatesRes.data);
    setSessions(sessionsRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const createTag = async (e) => {
    e.preventDefault();

    await api.post("/tags/", form);

    setForm({
      name: "",
      color: "",
      description: "",
    });

    loadData();
  };

  const assignTag = async (e) => {
    e.preventDefault();

    await api.post("/tags/assign", {
      athlete_id: Number(selectedAthleteId),
      tag_id: Number(selectedTagId),
    });

    setSelectedAthleteId("");
    loadTagAthletes(selectedTagId);
  };

  const loadTagAthletes = async (tagId) => {
    if (!tagId) return;

    const res = await api.get(`/tags/${tagId}/athletes`);
    setTagAthletes(res.data);
  };

  const handleTagSelect = async (tagId) => {
    setSelectedTagId(tagId);
    await loadTagAthletes(tagId);
  };

  const bulkSendByTag = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    const res = await api.post("/tags/bulk-send", {
      tag_ids: [Number(bulkMessage.tag_id)],
      template_id: Number(bulkMessage.template_id),
      session_id: bulkMessage.session_id ? Number(bulkMessage.session_id) : null,
      channel: bulkMessage.channel,
      subject: bulkMessage.subject || null,
      message_type: bulkMessage.channel === "sms" ? "bulk_sms" : "bulk_email",
    });

    setBulkSendResult(res.data);
    setBulkPreviewResult(null);
    await loadData();
  };

  const bulkPreviewByTag = async (e) => {
  e.preventDefault();
  setBulkPreviewError("");
  setBulkPreviewResult(null);

  try {
    const res = await api.post("/tags/bulk-preview", {
      tag_ids: [Number(bulkMessage.tag_id)],
      template_id: Number(bulkMessage.template_id),
      session_id: bulkMessage.session_id ? Number(bulkMessage.session_id) : null,
      channel: bulkMessage.channel,
      subject: bulkMessage.subject || null,
      message_type: bulkMessage.channel === "sms" ? "bulk_sms" : "bulk_email",
    });

    console.log("Bulk preview response:", res.data);
    setBulkPreviewResult(res.data);
    setBulkSendResult(null);
  } catch (error) {
    console.error("Bulk preview failed:", error);
    setBulkPreviewError(
      error?.response?.data?.detail || error.message || "Bulk preview failed"
    );
  }
};

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card title="Create Tag">
        <form onSubmit={createTag} className="space-y-3">
          <Input
            label="Tag Name"
            required
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
          />

          <Input
            label="Color"
            value={form.color}
            onChange={(v) => setForm({ ...form, color: v })}
          />

          <Textarea
            label="Description"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
          />

          <Button>Create Tag</Button>
        </form>
      </Card>

      <Card title="Assign Tag to Athlete">
        <form onSubmit={assignTag} className="space-y-3">
          <Select
            label="Tag"
            value={selectedTagId}
            onChange={handleTagSelect}
            options={tags.map((tag) => ({
              value: tag.id,
              label: tag.name,
            }))}
          />

          <Select
            label="Athlete"
            value={selectedAthleteId}
            onChange={setSelectedAthleteId}
            options={athletes.map((athlete) => ({
              value: athlete.id,
              label: `${athlete.first_name} ${athlete.last_name || ""}`,
            }))}
          />

          <Button>Assign Tag</Button>
        </form>
      </Card>

      <Card title="Saved Tags">
        <div className="space-y-3">
          {tags.map((tag) => (
            <div key={tag.id} className="rounded border p-3">
              <p className="font-semibold">{tag.name}</p>
              <p className="text-sm text-slate-600">
                Color: {tag.color || "—"}
              </p>
              <p className="text-sm text-slate-600">
                {tag.description || "No description"}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Athletes in Selected Tag">
        <div className="space-y-3">
          {tagAthletes.map((athlete) => (
            <div key={athlete.id} className="rounded border p-3">
              <p className="font-semibold">
                {athlete.first_name} {athlete.last_name}
              </p>
              <p className="text-sm text-slate-600">
                Status: {athlete.status}
              </p>
              <p className="text-sm text-slate-600">
                Location: {athlete.preferred_location || "—"}
              </p>
            </div>
          ))}

          {selectedTagId && tagAthletes.length === 0 && (
            <p className="text-sm text-slate-500">
              No athletes assigned to this tag yet.
            </p>
          )}
        </div>
      </Card>
      <Card title="Bulk Send by Tag">
          <form onSubmit={bulkPreviewByTag} className="space-y-3">
            <Select
              label="Tag"
              value={bulkMessage.tag_id}
              onChange={(v) => setBulkMessage({ ...bulkMessage, tag_id: v })}
              options={tags.map((tag) => ({
                value: tag.id,
                label: tag.name,
              }))}
            />

            <Select
              label="Channel"
              value={bulkMessage.channel}
              onChange={(v) => setBulkMessage({ ...bulkMessage, channel: v })}
              options={["sms", "email"]}
            />

            <Select
              label="Template"
              value={bulkMessage.template_id}
              onChange={(v) => setBulkMessage({ ...bulkMessage, template_id: v })}
              options={templates
                .filter((template) => template.channel === bulkMessage.channel)
                .map((template) => ({
                  value: template.id,
                  label: template.name,
                }))}
            />

            <Select
              label="Session Optional"
              value={bulkMessage.session_id}
              onChange={(v) => setBulkMessage({ ...bulkMessage, session_id: v })}
              required={false}
              options={sessions.map((session) => ({
                value: session.id,
                label: `${session.title} - ${session.location}`,
              }))}
            />

            {bulkMessage.channel === "email" && (
              <Input
                label="Email Subject"
                value={bulkMessage.subject}
                onChange={(v) => setBulkMessage({ ...bulkMessage, subject: v })}
              />
            )}

            <Button>Preview Bulk Messages</Button>
          </form>

          {bulkPreviewError && (
            <div className="mt-4 rounded bg-red-100 p-3 text-sm text-red-700">
              {bulkPreviewError}
            </div>
          )}
          {bulkPreviewResult && (
            <div className="mt-4 rounded bg-slate-50 p-4 text-sm">
              <p className="font-semibold">Bulk Preview</p>
              <p>Total Matched: {bulkPreviewResult.total_matched}</p>
              <p>Ready: {bulkPreviewResult.ready}</p>
              <p>Blocked: {bulkPreviewResult.blocked}</p>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={bulkSendByTag}
                  disabled={bulkPreviewResult.ready === 0}
                  className="rounded bg-green-700 px-4 py-2 font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  Confirm Bulk Send / Dry Run
                </button>

                <button
                  type="button"
                  onClick={() => setBulkPreviewResult(null)}
                  className="rounded bg-slate-700 px-4 py-2 font-medium text-white"
                >
                  Clear Preview
                </button>
              </div>

              <div className="mt-4 max-h-96 overflow-auto space-y-3">
                {bulkPreviewResult.results.map((item, index) => (
                  <div
                    key={index}
                    className={`rounded border p-3 ${
                      item.status === "ready" ? "border-green-300 bg-white" : "border-red-300 bg-red-50"
                    }`}
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{item.athlete_name}</p>
                        <p className="text-xs text-slate-600">
                          Parent: {item.parent_name || "—"}
                        </p>
                        <p className="text-xs text-slate-600">
                          Recipient: {item.recipient || "—"}
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium">
                        {item.status}
                      </span>
                    </div>

                    {item.reason && (
                      <p className="mb-2 rounded bg-red-100 p-2 text-xs text-red-700">
                        {item.reason}
                      </p>
                    )}

                    {bulkMessage.channel === "email" && (
                      <p className="mb-2 text-xs font-semibold">
                        Subject: {item.subject}
                      </p>
                    )}

                    <pre className="whitespace-pre-wrap rounded bg-slate-100 p-3 text-xs text-slate-700">
                      {item.body || "No message generated."}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bulkSendResult && (
            <div className="mt-4 rounded bg-slate-50 p-4 text-sm">
              <p className="font-semibold">Bulk Send Result</p>
              <p>Total Matched: {bulkSendResult.total_matched}</p>
              <p>Sent/Logged: {bulkSendResult.sent_or_logged}</p>
              <p>Blocked: {bulkSendResult.blocked}</p>

              <div className="mt-3 max-h-72 overflow-auto">
                {bulkSendResult.results.map((item, index) => (
                  <div key={index} className="border-b py-2">
                    <p>Athlete ID: {item.athlete_id}</p>
                    <p>Recipient: {item.recipient || "—"}</p>
                    <p>Status: {item.status}</p>
                    <p className="text-slate-600">{item.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
    </div>
  );
}