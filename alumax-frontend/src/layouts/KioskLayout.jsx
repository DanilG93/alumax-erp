import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { getWorkOrders, updateOrderItemStatus } from "../api/api";

function KioskLayout() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(), 15000); // Osvežava svakih 15 sekundi
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await getWorkOrders();
      const allOrders = Array.isArray(response.data) ? response.data : [];

      // Kiosk prikazuje SAMO naloge koji nisu kompletno završeni
      const activeOrders = allOrders.filter((o) => o.status !== "COMPLETED");
      setOrders(activeOrders);

      // Ako je neka "fascikla" trenutno otvorena, ažuriraj njene podatke u realnom vremenu
      setSelectedOrder((prevSelected) => {
        if (prevSelected) {
          const updatedOrder = activeOrders.find(
            (o) => o.id === prevSelected.id,
          );
          return updatedOrder || null; // Ako je nalog nestao (završen), zatvara se modal
        }
        return null;
      });
    } catch (error) {
      console.error("Greška pri učitavanju naloga za kiosk:", error);
    }
  };

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      await updateOrderItemStatus(itemId, newStatus);
      fetchOrders(); // Odmah povlači novo stanje iz baze i osvežava UI
    } catch (error) {
      console.error("Greška pri promeni statusa:", error);
      alert("Došlo je do greške pri menjanju statusa.");
    }
  };

  const getOrderProgress = (items) => {
    if (!items || items.length === 0) return { percent: 0, text: "0/0" };
    const completed = items.filter((i) => i.status === "COMPLETED").length;
    const percent = Math.round((completed / items.length) * 100);
    return { percent, text: `${completed}/${items.length}` };
  };

  return (
    <div
      className="d-flex"
      style={{ minHeight: "100vh", backgroundColor: "#e9ecef" }}
    >
      {/* Pametni meni */}
      <Sidebar />

      {/* GLAVNI EKRAN KIOSKA */}
      <div className="flex-grow-1 p-4 overflow-auto position-relative">
        <div className="d-flex justify-content-between align-items-center mb-4 bg-dark text-white p-3 rounded-3 shadow">
          <h2 className="m-0 fw-bold">🛠️ KIOSK: Aktivni Radni Nalozi</h2>
          <button
            className="btn btn-outline-light fw-bold px-4"
            onClick={fetchOrders}
          >
            🔄 OSVEŽI
          </button>
        </div>

        {/* MREŽA RADNIH NALOGA (FASCIKLI) */}
        <div className="row g-4">
          {orders.length > 0 ? (
            orders.map((order) => {
              const progress = getOrderProgress(order.items);
              return (
                <div key={order.id} className="col-md-6 col-lg-4 col-xl-3">
                  <div
                    className={`card h-100 shadow-sm border-0 rounded-4 overflow-hidden ${order.isUrgent ? "border-danger" : "border-primary"}`}
                    style={{
                      cursor: "pointer",
                      borderStart: "8px solid",
                      borderLeft: `8px solid ${order.isUrgent ? "#dc3545" : "#0d6efd"}`,
                    }}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div
                      className={`card-header border-0 ${order.isUrgent ? "bg-danger text-white" : "bg-light"}`}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <h4 className="fw-bold mb-0">
                          #{order.protocolNumber || "N/A"}
                        </h4>
                        {order.isUrgent && (
                          <span className="badge bg-white text-danger fw-bold shadow-sm">
                            HITNO
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="card-body p-4 text-center d-flex flex-column justify-content-center">
                      <h4 className="fw-bold text-dark mb-3">
                        {order.customerName}
                      </h4>
                      <p className="text-muted fw-bold mb-1">
                        Boja: {order.profileColor || "Nije navedena"}
                      </p>

                      <div className="mt-4">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="small fw-bold text-muted">
                            Završeno stavki:
                          </span>
                          <span className="small fw-bold text-dark">
                            {progress.text}
                          </span>
                        </div>
                        <div
                          className="progress"
                          style={{ height: "15px", borderRadius: "10px" }}
                        >
                          <div
                            className="progress-bar progress-bar-striped progress-bar-animated bg-success"
                            role="progressbar"
                            style={{ width: `${progress.percent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-12 text-center py-5 mt-5">
              <h2 className="text-muted fw-bold">
                Svi nalozi su završeni! Sto je čist. 🍺
              </h2>
            </div>
          )}
        </div>
      </div>

      {/* DETALJNI PREGLED: DIGITALNA FASCIKLA (MODAL OVERLAY) */}
      {selectedOrder && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.85)", zIndex: 1050 }}
        >
          <div
            className="card shadow-lg border-0 rounded-4 d-flex flex-column"
            style={{ width: "95%", height: "95vh" }}
          >
            {/* ZAGLAVLJE FASCIKLE */}
            <div
              className={`card-header p-4 d-flex justify-content-between align-items-center rounded-top-4 ${selectedOrder.isUrgent ? "bg-danger" : "bg-dark"} text-white`}
            >
              <div>
                <h2 className="m-0 fw-bold">
                  Nalog #{selectedOrder.protocolNumber || "N/A"} -{" "}
                  {selectedOrder.customerName}
                </h2>
                <span className="fs-5 opacity-75">
                  Boja profila:{" "}
                  <strong>{selectedOrder.profileColor || "Nema"}</strong>
                </span>
              </div>
              <button
                className="btn btn-lg btn-outline-light fw-bold px-5"
                onClick={() => setSelectedOrder(null)}
              >
                ZATVORI (NAZAD)
              </button>
            </div>

            {/* TELO FASCIKLE SA STAVKAMA */}
            <div className="card-body p-0 overflow-auto bg-light">
              <table className="table table-bordered table-hover align-middle m-0 fs-5">
                <thead className="table-light sticky-top">
                  <tr>
                    <th className="py-3 px-4">Br.</th>
                    <th className="py-3">Dimenzije (W x H)</th>
                    <th className="py-3 text-center">Vrsta / Smer</th>
                    <th className="py-3 text-center">Komada</th>
                    <th className="py-3">Napomena (Pročitaj!)</th>
                    <th className="py-3 text-center" style={{ width: "250px" }}>
                      AKCIJA (Klikni)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={
                          item.urgent
                            ? "table-danger"
                            : item.status === "COMPLETED"
                              ? "table-success opacity-50"
                              : "bg-white"
                        }
                      >
                        <td className="px-4 fw-bold text-muted">{idx + 1}</td>
                        <td className="fw-bold fs-3 text-dark">
                          {item.widthW}{" "}
                          <span className="text-muted fs-5">x</span>{" "}
                          {item.heightH}
                        </td>
                        <td className="text-center fw-bold text-secondary">
                          <span className="d-block text-dark">
                            {item.productTemplate?.name || "Standard"}
                          </span>
                          <span className="d-block fs-6 mt-1">
                            {item.openingDirection === "LEFT"
                              ? "← Levo"
                              : "Desno →"}
                          </span>
                          {item.type === "SERVICE" && (
                            <span className="badge bg-warning text-dark mt-1">
                              SERVIS
                            </span>
                          )}
                        </td>
                        <td className="fw-bold fs-2 text-center text-primary">
                          {item.quantity}
                        </td>
                        <td className="text-danger fw-bold fst-italic">
                          {item.note || "-"}
                        </td>

                        {/* 3 FAZE DUGMETA */}
                        <td className="p-3">
                          {item.status === "NEW" && (
                            <button
                              className="btn btn-primary btn-lg fw-bold w-100 py-3 shadow-sm"
                              onClick={() =>
                                handleStatusChange(item.id, "IN_PROGRESS")
                              }
                            >
                              KRENI U RAD
                            </button>
                          )}

                          {item.status === "IN_PROGRESS" && (
                            <button
                              className="btn btn-warning text-dark btn-lg fw-bold w-100 py-3 shadow-sm"
                              onClick={() =>
                                handleStatusChange(
                                  item.id,
                                  "READY_FOR_ASSEMBLY",
                                )
                              }
                            >
                              GOTOVA MREŽICA
                            </button>
                          )}

                          {item.status === "READY_FOR_ASSEMBLY" && (
                            <button
                              className="btn btn-success btn-lg fw-bold w-100 py-3 shadow-sm"
                              onClick={() =>
                                handleStatusChange(item.id, "COMPLETED")
                              }
                            >
                              GOTOVO
                            </button>
                          )}

                          {item.status === "COMPLETED" && (
                            <div className="bg-success text-white fw-bold text-center rounded-2 py-3">
                              ✔ ZAVRŠENO
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">
                        Nema stavki u nalogu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KioskLayout;
