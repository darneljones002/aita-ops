import { useEffect, useState } from "react";
import { api } from "../api/client";
import Card from "../components/Card";
import Button from "../components/Button";

export default function MessageLogsPage() {
  const [logs, setLogs] = useState([]);

  const loadLogs = async () => {
    const res = await api.get("/message-logs/");
    setLogs(res.data);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const copyMessage = async (body) => {
    await navigator.clipboard.writeText(body);
  };

  return (
    <div className="space-y-6">
      <Card title="Message Logs">
        <div className="mb-4 flex justify-end">
          <Button type="button" onClick={loadLogs}>
            Refresh Logs
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                <th className="p-3">Created</th>
                <th className="p-3">ID</th>
                <th className="p-3">Channel</th>
                <th className="p-3">Recipient</th>
                <th className="p-3">Status</th>
                <th className="p-3">Provider ID</th>
                <th className="p-3">Message</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b align-top">
                  <td className="p-3">{log.id}</td>
                  <td className="p-3 text-xs text-slate-500">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : "—"}
                  </td>
                  <td className="p-3">{log.channel}</td>
                  <td className="p-3">{log.recipient}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium">
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-slate-500">
                    {log.provider_message_id || "—"}
                  </td>
                  <td className="max-w-xl whitespace-pre-wrap p-3 text-slate-700">
                    {log.body}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => copyMessage(log.body)}
                      className="rounded bg-slate-900 px-3 py-1 text-xs text-white"
                    >
                      Copy
                    </button>
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-slate-500">
                    No message logs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}