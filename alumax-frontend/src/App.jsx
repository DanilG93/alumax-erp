import { Routes, Route, Navigate } from "react-router-dom";
import KioskLayout from "./layouts/KioskLayout";
import AdminLayout from "./layouts/AdminLayout";
import SettingsLayout from "./layouts/SettingsLayout";

function App() {
  return (
    <Routes>
      <Route path="/kiosk" element={<KioskLayout />} />
      <Route path="/admin" element={<AdminLayout />} />
      <Route path="/settings" element={<SettingsLayout />} />
      <Route path="/" element={<Navigate to="/kiosk" replace />} />
    </Routes>
  );
}

export default App;
