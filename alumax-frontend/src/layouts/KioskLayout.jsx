import { useState, useEffect } from "react";
import { getWorkOrders, updateWorkOrderStatus } from "../api/api";

function KioskLayout() {
  const [allOrders, setAllOrders] = useState([]);
  const [activeStatus, setActiveStatus] = useState("NEW");
  const [loading, setLoading] = useState(true);

  // Definisanje statusa sa srpskim nazivima i Bootstrap bojama
  const statusTabs = {
    NEW: { label: "NOVO", color: "secondary" },
    IN_PROGRESS: { label: "U RADU", color: "primary" },
    READY_FOR_ASSEMBLY: { label: "ZA SKLAPANJE", color: "warning" },
    COMPLETED: { label: "ZAVRŠENO", color: "success" },
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getWorkOrders();
      setAllOrders(response.data);
    } catch (error) {
      console.error("Greška pri učitavanju naloga:", error);
      alert("Ne mogu da učitam naloge. Da li je backend pokrenut?");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateWorkOrderStatus(id, newStatus);
      // Osveži listu nakon promene statusa
      fetchOrders();
    } catch (error) {
      console.error("Greška pri ažuriranju statusa:", error);
      alert("Greška pri ažuriranju statusa!");
    }
  };

  // Filtriramo naloge samo za trenutno izabrani tab
  const filteredOrders = allOrders.filter(
    (order) => order.status === activeStatus,
  );

  // Renderovanje dugmadi prilagođenih za klik na tabletu
  const renderActions = (order) => {
    if (order.status === "COMPLETED") {
      return <span className="badge bg-success fs-5 p-2">✅ ZAVRŠENO</span>;
    }

    return (
      <div className="d-flex gap-2 justify-content-end">
        {order.status === "NEW" && (
          <button
            className="btn btn-primary btn-sm fw-bold px-3"
            onClick={() => handleStatusChange(order.id, "IN_PROGRESS")}
          >
            🚀 KRENI U RAD
          </button>
        )}

        {(order.status === "IN_PROGRESS" || order.status === "NEW") && (
          <button
            className="btn btn-warning btn-sm fw-bold px-3"
            onClick={() => handleStatusChange(order.id, "READY_FOR_ASSEMBLY")}
          >
            🧵 ZAVRŠENA MREŽICA
          </button>
        )}

        {order.status !== "COMPLETED" && (
          <button
            className="btn btn-success btn-sm fw-bold px-3"
            onClick={() => handleStatusChange(order.id, "COMPLETED")}
          >
            ✅ ZAVRŠENO
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div
        className="container-fluid text-center bg-light"
        style={{ minHeight: "100vh" }}
      >
        <h1 className="display-4 pt-5">⏳ Učitavanje naloga...</h1>
      </div>
    );
  }

  return (
    <div
      className="container-fluid bg-light p-4"
      style={{ minHeight: "100vh" }}
    >
      <h2 className="mb-4 text-dark fw-bold">🏭 ALUMAX KIOSK</h2>

      {/* TABS - Navigacija po statusima */}
      <ul className="nav nav-pills nav-fill mb-4 gap-2">
        {Object.keys(statusTabs).map((status) => {
          const count = allOrders.filter((o) => o.status === status).length;
          return (
            <li className="nav-item" key={status}>
              <button
                className={`btn btn-${statusTabs[status].color} btn-lg w-100 ${
                  activeStatus === status
                    ? "active fw-bold border border-dark"
                    : "opacity-75"
                }`}
                onClick={() => setActiveStatus(status)}
                style={{ fontSize: "1.2rem" }}
              >
                {statusTabs[status].label} ({count})
              </button>
            </li>
          );
        })}
      </ul>

      {/* PRIKAZ NALOGA U OBLIKU TABELE */}
      {filteredOrders.length === 0 ? (
        <div className="alert alert-secondary text-center mt-4 fs-4 border-0 shadow-sm">
          📭 Nema naloga u ovoj kategoriji.
        </div>
      ) : (
        <div className="table-responsive bg-white shadow-sm rounded border">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th className="text-center" style={{ width: "80px" }}>
                  ID
                </th>
                <th>Kupac / Opis</th>
                <th className="text-center">Dimenzije (Š x V)</th>
                {/* Ovde ćemo kasnije dodati kolonu za mere za sečenje */}
                <th className="text-end pe-4">Akcije</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className="text-center fw-bold fs-5 text-secondary">
                    #{order.id}
                  </td>
                  <td className="fs-5 fw-medium text-dark">
                    {order.customerDescription || "Nema opisa"}
                  </td>
                  <td className="text-center fs-5">
                    <span className="badge bg-secondary me-1">
                      {order.inputWidth} mm
                    </span>
                    x
                    <span className="badge bg-secondary ms-1">
                      {order.inputHeight} mm
                    </span>
                  </td>
                  <td className="text-end pe-3">{renderActions(order)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default KioskLayout;
