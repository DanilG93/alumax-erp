import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { getWorkOrders, toggleItemUrgency } from "../api/api";

function DashboardLayout() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
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

  // --- FUNKCIJA ZA TOGGLE HITNO NA KOMARNIKU ---
  const handleToggleItemUrgency = async (itemId) => {
    try {
      await toggleItemUrgency(itemId);

      // Osveži prikaz u modalu momentalno (da korisnik ne čeka)
      setSelectedOrder((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.id === itemId ? { ...i, urgent: !i.urgent } : i,
        ),
      }));

      // Osveži bazu u pozadini
      fetchOrders();
    } catch (error) {
      console.error("Greška pri promeni prioriteta:", error);
      alert("Došlo je do greške pri promeni statusa.");
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

  const getOrderProgress = (items) => {
    if (!items || items.length === 0) return { percent: 0, text: "0/0" };
    const completed = items.filter((i) => i.status === "COMPLETED").length;
    const percent = Math.round((completed / items.length) * 100);
    return { percent, text: `${completed}/${items.length}` };
  };

  const getItemStatusBadge = (status) => {
    switch (status) {
      case "NEW":
        return (
          <span className="badge bg-secondary rounded-1 px-2 py-1">
            ČEKA NA RAD
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="badge bg-warning text-dark rounded-1 px-2 py-1">
            U RADU
          </span>
        );
      case "COMPLETED":
        return (
          <span className="badge bg-success rounded-1 px-2 py-1">ZAVRŠENO</span>
        );
      default:
        return (
          <span className="badge bg-dark rounded-1 px-2 py-1">{status}</span>
        );
    }
  };

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
        order.items && order.items.some((i) => i.jobType === "SERVICE");

    return matchesSearch && matchesFilter;
  });

  return (
    <div
      className="d-flex"
      style={{ minHeight: "100vh", backgroundColor: "#f4f6f9" }}
    >
      {/* BOČNI MENI */}
      <Sidebar />
      {/* GLAVNI SADRŽAJ */}
      <div className="flex-grow-1 p-4 p-md-5 overflow-auto position-relative">
        <h2 className="fw-bold text-dark mb-4">Pregled Proizvodnje</h2>

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
                        onClick={() => setSelectedOrder(order)}
                        style={{ cursor: "pointer" }}
                        title="Klikni za detalje naloga"
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
                              order.items.some(
                                (i) => i.jobType === "SERVICE",
                              ) && (
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

      {/* MODAL ZA DETALJE NALOGA */}
      {selectedOrder && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1050 }}
        >
          <div
            className="card shadow-lg border-0 rounded-0"
            style={{
              width: "95%",
              maxWidth: "1100px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              className={`card-header d-flex justify-content-between align-items-center p-4 border-0 ${selectedOrder.isUrgent ? "bg-danger text-white" : "bg-dark text-white"}`}
            >
              <div>
                <h4 className="mb-0 fw-bold">
                  Nalog: {selectedOrder.protocolNumber || "N/A"}
                </h4>
                <span className="opacity-75">{selectedOrder.customerName}</span>
              </div>
              <div className="text-end">
                <div className="fw-bold mb-1">
                  Rok: {selectedOrder.deliveryDate || "Nije definisan"}
                </div>
                {selectedOrder.requiresDelivery && (
                  <span className="badge bg-primary rounded-1">
                    Za isporuku
                  </span>
                )}
              </div>
            </div>

            <div
              className="card-body p-4 overflow-auto"
              style={{ backgroundColor: "#f8f9fa" }}
            >
              <h6 className="fw-bold text-muted text-uppercase mb-3">
                Sadržaj naloga ({selectedOrder.items?.length || 0} stavki)
              </h6>

              <div className="table-responsive border rounded bg-white">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="py-3 px-3">Tip</th>
                      <th className="py-3">Dimenzije</th>
                      <th className="py-3 text-center">Komada</th>
                      <th className="py-3">Vrsta / Šablon</th>
                      <th className="py-3 text-center">Smer</th>
                      <th className="py-3 text-center">Prioritet (Hitno)</th>
                      <th className="py-3">Napomena</th>
                      <th className="py-3 text-end px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item, idx) => (
                        <tr
                          key={item.id || idx}
                          className={item.urgent ? "table-danger" : ""}
                        >
                          <td className="px-3">
                            {item.jobType === "SERVICE" ? (
                              <span className="badge bg-warning text-dark rounded-1">
                                SERVIS
                              </span>
                            ) : (
                              <span className="badge bg-primary rounded-1">
                                NOVO
                              </span>
                            )}
                          </td>
                          <td className="fw-bold">
                            {item.widthW} x {item.heightH}
                          </td>
                          <td className="fw-bold text-center">
                            {item.quantity}
                          </td>
                          <td className="text-muted fw-bold">
                            {item.productTemplate
                              ? item.productTemplate.name
                              : "Bez šablona"}
                          </td>
                          <td className="text-center">
                            {item.openingDirection === "LEFT"
                              ? "Levo"
                              : "Desno"}
                          </td>

                          {/* NOVO: TOGGLE ZA HITNO */}
                          <td className="text-center">
                            <div className="form-check form-switch d-inline-flex justify-content-center w-100">
                              <input
                                className={`form-check-input mt-0 fs-5 ${item.urgent ? "bg-danger border-danger" : ""}`}
                                type="checkbox"
                                role="switch"
                                checked={item.urgent || false}
                                onChange={() =>
                                  handleToggleItemUrgency(item.id)
                                }
                                style={{ cursor: "pointer" }}
                                title="Označi komarnik kao hitan"
                              />
                            </div>
                          </td>

                          <td className="small fst-italic text-muted">
                            {item.note || "-"}
                          </td>
                          <td className="text-end px-3">
                            {getItemStatusBadge(item.status)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center py-4 text-muted">
                          Nema definisanih stavki.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card-footer bg-white p-3 text-end border-top">
              <button
                className="btn btn-outline-dark fw-bold px-4 py-2 rounded-1"
                onClick={() => setSelectedOrder(null)}
              >
                ZATVORI PREGLED
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardLayout;
