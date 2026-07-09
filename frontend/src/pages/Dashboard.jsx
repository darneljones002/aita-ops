import { useEffect, useState } from "react";
import { api } from "../api/client";
import Stat from "../components/Stat";

export default function Dashboard() {
  const [data, setData] = useState({
    parents: [],
    athletes: [],
    sessions: [],
    invites: [],
  });

  useEffect(() => {
    async function loadData() {
      const [parents, athletes, sessions, invites] = await Promise.all([
        api.get("/parents/"),
        api.get("/athletes/"),
        api.get("/sessions/"),
        api.get("/invites/"),
      ]);

      setData({
        parents: parents.data,
        athletes: athletes.data,
        sessions: sessions.data,
        invites: invites.data,
      });
    }

    loadData();
  }, []);

  const confirmed = data.invites.filter((i) => i.status === "confirmed").length;
  const noResponse = data.invites.filter((i) => i.status === "no_response").length;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Stat title="Parents" value={data.parents.length} />
        <Stat title="Athletes" value={data.athletes.length} />
        <Stat title="Sessions" value={data.sessions.length} />
        <Stat title="Invites" value={data.invites.length} />
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Stat title="Confirmed RSVPs" value={confirmed} />
        <Stat title="No Response" value={noResponse} />
      </section>
    </div>
  );
}