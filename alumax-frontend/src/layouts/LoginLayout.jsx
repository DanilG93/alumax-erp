import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/api";

function LoginLayout() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await loginUser({ username, password });
      const user = response.data;

      // Čuvamo podatke o korisniku u lokalnoj memoriji pretraživača
      localStorage.setItem("user", JSON.stringify(user));

      // Rutiranje na osnovu uloge
      if (user.role === "WORKER") {
        navigate("/kiosk");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError("Pogrešno korisničko ime ili lozinka!");
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh", backgroundColor: "#f4f6f9" }}
    >
      <div
        className="card shadow-lg border-0 rounded-4"
        style={{ width: "100%", maxWidth: "450px" }}
      >
        <div className="card-header bg-dark text-white text-center p-4 border-0 rounded-top-4">
          <h2 className="fw-bold mb-0">Alumax ERP</h2>
          <p className="mb-0 text-white-50">Kontrola Proizvodnje</p>
        </div>
        <div className="card-body p-5">
          <h5 className="text-center fw-bold mb-4">Prijava u sistem</h5>

          {error && (
            <div className="alert alert-danger fw-bold text-center py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label fw-bold text-muted">
                Korisničko ime
              </label>
              <input
                type="text"
                className="form-control form-control-lg bg-light"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="form-label fw-bold text-muted">Lozinka</label>
              <input
                type="password"
                className="form-control form-control-lg bg-light"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg w-100 fw-bold shadow-sm"
            >
              Uloguj se
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginLayout;
