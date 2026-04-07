import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Orgs from "./pages/Orgs";
import Contacts from "./pages/Contacts";
import Pipeline from "./pages/Pipeline";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"          element={<Dashboard />} />
        <Route path="/orgs"      element={<Orgs />} />
        <Route path="/contacts"  element={<Contacts />} />
        <Route path="/pipeline"  element={<Pipeline />} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
