import { Routes, Route, Navigate } from "react-router-dom";
import KioskLayout from "./layouts/KioskLayout";
import AdminLayout from "./layouts/AdminLayout";
import SettingsLayout from "./layouts/SettingsLayout";
import DashboardLayout from "./layouts/DashboardLayout";

function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardLayout />} />
      <Route path="/kiosk" element={<KioskLayout />} />
      <Route path="/admin" element={<AdminLayout />} />
      <Route path="/settings" element={<SettingsLayout />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
