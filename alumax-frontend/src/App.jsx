import { Routes, Route, Navigate } from "react-router-dom";
import KioskLayout from "./layouts/KioskLayout";
import AdminLayout from "./layouts/AdminLayout";
import SettingsLayout from "./layouts/SettingsLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import LoginLayout from "./layouts/LoginLayout";

// Komponenta za zaštitu ruta (Čuvar)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const userString = localStorage.getItem("user");

  // Ako korisnik nije ulogovan, odmah ga baci na Login
  if (!userString) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userString);

  // Ako je ulogovan, ali njegova uloga nije na listi dozvoljenih za ovu rutu
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "WORKER") {
      return <Navigate to="/kiosk" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Ako je sve u redu, prikaži stranicu
  return children;
};

function App() {
  return (
    <Routes>
      {/* JAVNA RUTA */}
      <Route path="/login" element={<LoginLayout />} />

      {/* ZAŠTIĆENE RUTE */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["HEAD_ADMIN", "ADMIN"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["HEAD_ADMIN", "ADMIN"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={["HEAD_ADMIN"]}>
            <SettingsLayout />
          </ProtectedRoute>
        }
      />

      <Route
        path="/kiosk"
        element={
          <ProtectedRoute allowedRoles={["HEAD_ADMIN", "ADMIN", "WORKER"]}>
            <KioskLayout />
          </ProtectedRoute>
        }
      />

      {/* Ako neko ukuca samo localhost:5173, baci ga na login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
