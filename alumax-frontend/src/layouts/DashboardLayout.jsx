import { useState, useEffect } from "react";
import { getWorkOrders } from "../api/api";

function DashboardLayout() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

  useEffect(() => {
    fetchOrders();
    // Osvežavanje podataka svakih 30 sekundi
    const interval = setInterval(() => fetchOrders(), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await getWorkOrders();
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Greška pri učitavanju naloga:", error);
    }
  };

  // --- KALKULACIJA STATISTIKE (KPI) ---
  let totalNew = 0;
  let totalInProgress = 0;
  let totalCompleted = 0;
  let urgentCount = 0;

  orders.forEach((order) => {
    if (order.isUrgent) urgentCount++;
    if (order.items) {
      order.items.forEach((item) => {
        if (item.status === "NEW") totalNew++;
        if (item.status === "IN_PROGRESS") totalInProgress++;
        if (item.status === "COMPLETED") totalCompleted++;
      });
    }
  });

  // --- FUNKCIJA ZA PROGRES NALOGA ---
  const getOrderProgress = (items) => {
    if (!items || items.length === 0) return { percent: 0, text: "0/0" };
    const completed = items.filter((i) => i.status === "COMPLETED").length;
    const percent = Math.round((completed / items.length) * 100);
    return { percent, text: `${completed}/${items.length}` };
  };

  // --- FILTRIRANJE PRETRAGE ---
  const filteredOrders = orders.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (order.customerName &&
        order.customerName.toLowerCase().includes(searchLower)) ||
      (order.protocolNumber &&
        order.protocolNumber.toLowerCase().includes(searchLower));

    let matchesFilter = true;
    if (activeFilter === "URGENT") matchesFilter = order.isUrgent;
    if (activeFilter === "DELIVERY") matchesFilter = order.requiresDelivery;
    if (activeFilter === "SERVICE")
      matchesFilter =
        order.items && order.items.some((i) => i.type === "SERVICE");

    return matchesSearch && matchesFilter;
  });

  return (
    <div
      className="d-flex"
      style={{ minHeight: "100vh", backgroundColor: "#f4f6f9" }}
    >
      {/* BOČNI MENI */}
      <div
        className="bg-dark text-white p-3 shadow-sm"
        style={{ width: "260px" }}
      >
        <h3 className="mb-4 text-center fw-bold mt-2">Alumax ERP</h3>
        <hr className="text-secondary" />
        <ul className="nav nav-pills flex-column mb-auto gap-2">
          <li className="nav-item">
            <a
              href="/dashboard"
              className="nav-link active fw-bold fs-5 rounded-1"
            >
              Komandni Centar
            </a>
          </li>
          <li>
            <a
              href="/admin"
              className="nav-link text-white fs-5 rounded-1 opacity-75"
            >
              Nova Narudžbina
            </a>
          </li>
          <li>
            <a
              href="/kiosk"
              className="nav-link text-white fs-5 rounded-1 opacity-75"
            >
              Radionica (Kiosk)
            </a>
          </li>
          <li>
            <a
              href="/settings"
              className="nav-link text-white fs-5 rounded-1 opacity-75"
            >
              Podešavanja
            </a>
          </li>
        </ul>
      </div>

      {/* GLAVNI SADRŽAJ */}
      <div className="flex-grow-1 p-4 p-md-5 overflow-auto">
        <h2 className="fw-bold text-dark mb-4">Pregled Proizvodnje</h2>

        {/* KPI KARTICE (Statistika) */}
        <div className="row g-4 mb-5">
          <div className="col-md-3">
            <div className="card shadow-sm border-0 border-start border-primary border-4 rounded-2 h-100 p-3">
              <h6 className="text-muted fw-bold text-uppercase mb-2">
                Čeka na rad
              </h6>
              <h2 className="fw-bold text-dark mb-0">
                {totalNew}{" "}
                <span className="fs-6 text-muted fw-normal">stavki</span>
              </h2>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0 border-start border-warning border-4 rounded-2 h-100 p-3">
              <h6 className="text-muted fw-bold text-uppercase mb-2">
                Trenutno u radu
              </h6>
              <h2 className="fw-bold text-dark mb-0">
                {totalInProgress}{" "}
                <span className="fs-6 text-muted fw-normal">stavki</span>
              </h2>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0 border-start border-danger border-4 rounded-2 h-100 p-3 bg-danger bg-opacity-10">
              <h6 className="text-danger fw-bold text-uppercase mb-2">
                Hitni Nalozi
              </h6>
              <h2 className="fw-bold text-danger mb-0">
                {urgentCount}{" "}
                <span className="fs-6 text-danger opacity-75 fw-normal">
                  naloga
                </span>
              </h2>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0 border-start border-success border-4 rounded-2 h-100 p-3">
              <h6 className="text-muted fw-bold text-uppercase mb-2">
                Završeno ukupno
              </h6>
              <h2 className="fw-bold text-dark mb-0">
                {totalCompleted}{" "}
                <span className="fs-6 text-muted fw-normal">stavki</span>
              </h2>
            </div>
          </div>
        </div>

        {/* PRETRAGA I FILTERI */}
        <div className="card shadow-sm border-0 rounded-2 p-3 mb-4 bg-white">
          <div className="row align-items-center g-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control form-control-lg bg-light border-0"
                placeholder="Pretraga kupca ili protokola..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-8">
              <div className="d-flex gap-2 justify-content-md-end">
                <button
                  className={`btn fw-bold px-4 rounded-1 ${activeFilter === "ALL" ? "btn-dark" : "btn-outline-dark"}`}
                  onClick={() => setActiveFilter("ALL")}
                >
                  Svi Nalozi
                </button>
                <button
                  className={`btn fw-bold px-4 rounded-1 ${activeFilter === "URGENT" ? "btn-danger" : "btn-outline-danger"}`}
                  onClick={() => setActiveFilter("URGENT")}
                >
                  Hitno
                </button>
                <button
                  className={`btn fw-bold px-4 rounded-1 ${activeFilter === "SERVICE" ? "btn-warning text-dark" : "btn-outline-warning text-dark"}`}
                  onClick={() => setActiveFilter("SERVICE")}
                >
                  Servisi
                </button>
                <button
                  className={`btn fw-bold px-4 rounded-1 ${activeFilter === "DELIVERY" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setActiveFilter("DELIVERY")}
                >
                  Za Isporuku
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TABELA RADNIH NALOGA */}
        <div className="card shadow-sm border-0 rounded-2 bg-white">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="py-3 px-4">Protokol</th>
                  <th className="py-3">Naručilac</th>
                  <th className="py-3">Rok Završetka</th>
                  <th className="py-3">Oznake</th>
                  <th className="py-3" style={{ minWidth: "150px" }}>
                    Progres
                  </th>
                  <th className="py-3 text-end px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => {
                    const progress = getOrderProgress(order.items);
                    return (
                      <tr
                        key={order.id}
                        className={order.isUrgent ? "table-danger" : ""}
                      >
                        <td className="px-4 fw-bold">
                          {order.protocolNumber || "N/A"}
                        </td>
                        <td className="fw-bold">{order.customerName}</td>
                        <td className="fw-medium">
                          {order.deliveryDate || "-"}
                        </td>
                        <td>
                          <div className="d-flex gap-1 flex-wrap">
                            {order.isUrgent && (
                              <span className="badge bg-danger rounded-1">
                                HITNO
                              </span>
                            )}
                            {order.requiresDelivery && (
                              <span className="badge bg-primary rounded-1">
                                ISPORUKA
                              </span>
                            )}
                            {order.items &&
                              order.items.some((i) => i.type === "SERVICE") && (
                                <span className="badge bg-warning text-dark rounded-1">
                                  SADRŽI SERVIS
                                </span>
                              )}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className="small fw-bold">
                              {progress.text}
                            </span>
                            <div
                              className="progress flex-grow-1"
                              style={{ height: "8px" }}
                            >
                              <div
                                className={`progress-bar ${progress.percent === 100 ? "bg-success" : "bg-primary"}`}
                                role="progressbar"
                                style={{ width: `${progress.percent}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="text-end px-4">
                          <span
                            className={`badge rounded-1 fs-6 px-3 py-2 ${order.status === "COMPLETED" ? "bg-success" : "bg-dark"}`}
                          >
                            {order.status === "COMPLETED"
                              ? "GOTOVO"
                              : "OTVOREN"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-5 text-muted fw-bold"
                    >
                      Nema rezultata za zadatu pretragu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
