import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ParentsPage from "./pages/ParentsPage";
import AthletesPage from "./pages/AthletesPage";
import SessionsPage from "./pages/SessionsPage";
import InvitesPage from "./pages/InvitesPage";
import MessageTemplatesPage from "./pages/MessageTemplatesPage";
import MessageLogsPage from "./pages/MessageLogsPage";
import TagsPage from "./pages/TagsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/parents" element={<ParentsPage />} />
          <Route path="/athletes" element={<AthletesPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/invites" element={<InvitesPage />} />
          <Route path="/message-templates" element={<MessageTemplatesPage />} />
          <Route path="/message-logs" element={<MessageLogsPage />} />
          <Route path="/tags" element={<TagsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}