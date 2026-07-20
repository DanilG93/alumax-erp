import { Link, useLocation, useNavigate } from "react-router-dom";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const userString = localStorage.getItem("user");

  // Ako korisnik iz nekog razloga nema sesiju, ne renderujemo sidebar
  if (!userString) return null;
  const user = JSON.parse(userString);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div
      className="bg-dark text-white p-3 shadow-lg d-flex flex-column"
      style={{ width: "260px", minHeight: "100vh" }}
    >
      <h3 className="mb-2 text-center fw-bold mt-2">Alumax ERP</h3>

      {/* Informacije o ulogovanom korisniku */}
      <div className="text-center mb-4">
        <span className="badge bg-primary bg-opacity-25 text-info border border-info fs-6">
          👤 {user.username} ({user.role})
        </span>
      </div>

      <hr className="text-secondary mt-0" />

      <ul className="nav nav-pills flex-column mb-auto gap-2">
        {/* Vidljivo za HEAD_ADMIN i ADMIN */}
        {(user.role === "HEAD_ADMIN" || user.role === "ADMIN") && (
          <>
            <li className="nav-item">
              <Link
                to="/dashboard"
                className={`nav-link fs-5 rounded-1 ${location.pathname === "/dashboard" ? "active fw-bold" : "text-white opacity-75"}`}
              >
                Komandni Centar
              </Link>
            </li>
            <li>
              <Link
                to="/admin"
                className={`nav-link fs-5 rounded-1 ${location.pathname === "/admin" ? "active fw-bold" : "text-white opacity-75"}`}
              >
                Nova Narudžbina
              </Link>
            </li>
          </>
        )}

        {/* Vidljivo za SVE (HEAD_ADMIN, ADMIN, WORKER) */}
        <li>
          <Link
            to="/kiosk"
            className={`nav-link fs-5 rounded-1 ${location.pathname === "/kiosk" ? "active fw-bold" : "text-white opacity-75"}`}
          >
            Radionica (Kiosk)
          </Link>
        </li>

        {/* Vidljivo SAMO za HEAD_ADMIN */}
        {user.role === "HEAD_ADMIN" && (
          <li>
            <Link
              to="/settings"
              className={`nav-link fs-5 rounded-1 ${location.pathname === "/settings" ? "active fw-bold" : "text-white opacity-75"}`}
            >
              Podešavanja
            </Link>
          </li>
        )}
      </ul>

      <hr className="text-secondary" />

      {/* Dugme za odjavu */}
      <button
        onClick={handleLogout}
        className="btn btn-outline-danger fw-bold w-100 mt-auto"
      >
        Odjavi se
      </button>
    </div>
  );
}

export default Sidebar;
