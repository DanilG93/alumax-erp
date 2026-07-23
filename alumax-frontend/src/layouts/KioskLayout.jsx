import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getWorkOrders,
  updateOrderItemStatus,
  getItemCalculations,
} from "../api/api";

function KioskLayout() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingCalcs, setLoadingCalcs] = useState(false);

  const [viewMode, setViewMode] = useState("ACTIVE"); // 'ACTIVE' ili 'COMPLETED'
  const [notesModal, setNotesModal] = useState({ isOpen: false, text: "" });

  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(), 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await getWorkOrders();
      const allOrders = Array.isArray(response.data) ? response.data : [];
      setOrders(allOrders);

      setSelectedOrder((prevSelected) => {
        if (prevSelected) {
          const updatedOrder = allOrders.find((o) => o.id === prevSelected.id);
          if (updatedOrder) {
            return { ...updatedOrder, items: prevSelected.items };
          }
        }
        return null;
      });
    } catch (error) {
      console.error("Greška pri učitavanju naloga za kiosk:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleOpenOrder = async (order) => {
    setLoadingCalcs(true);

    try {
      const itemsWithCalculations = await Promise.all(
        order.items.map(async (item) => {
          if (item.type !== "SERVICE" && item.productTemplate) {
            try {
              const calcRes = await getItemCalculations(item.id);
              const templateNotes = item.productTemplate.notes
                ? item.productTemplate.notes.join("\n")
                : "";
              const fullNote = [templateNotes, item.note]
                .filter(Boolean)
                .join("\n\n---\n");

              return { ...item, calculations: calcRes.data, fullNote };
            } catch (err) {
              return { ...item, calculations: [], fullNote: item.note || "" };
            }
          }
          return { ...item, calculations: [], fullNote: item.note || "" };
        }),
      );

      setSelectedOrder({ ...order, items: itemsWithCalculations });
    } catch (error) {
      console.error("Greška pri učitavanju mera:", error);
    } finally {
      setLoadingCalcs(false);
    }
  };

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      await updateOrderItemStatus(itemId, newStatus);

      setSelectedOrder((prev) => {
        if (!prev) return prev;
        const updatedItems = prev.items.map((i) =>
          i.id === itemId ? { ...i, status: newStatus } : i,
        );
        return { ...prev, items: updatedItems };
      });

      fetchOrders();
    } catch (error) {
      console.error("Greška pri promeni statusa:", error);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (!selectedOrder || !selectedOrder.items) return;

    const itemsToUpdate = selectedOrder.items.filter((item) => {
      if (newStatus === "READY_FOR_ASSEMBLY") {
        return item.status === "NEW" || item.status === "IN_PROGRESS";
      }
      if (newStatus === "COMPLETED") {
        return item.status !== "COMPLETED";
      }
      return false;
    });

    if (itemsToUpdate.length === 0) return;

    setLoadingCalcs(true);

    try {
      await Promise.all(
        itemsToUpdate.map((item) => updateOrderItemStatus(item.id, newStatus)),
      );

      setSelectedOrder((prev) => {
        if (!prev) return prev;
        const updatedItems = prev.items.map((item) => {
          if (itemsToUpdate.find((i) => i.id === item.id)) {
            return { ...item, status: newStatus };
          }
          return item;
        });
        return { ...prev, items: updatedItems };
      });

      fetchOrders();
    } catch (error) {
      console.error("Greška pri masovnoj promeni statusa:", error);
      alert("Došlo je do greške prilikom ažuriranja svih stavki.");
    } finally {
      setLoadingCalcs(false);
    }
  };

  const getOrderProgress = (items) => {
    if (!items || items.length === 0) return { percent: 0, text: "0/0" };
    const completed = items.filter((i) => i.status === "COMPLETED").length;
    const percent = Math.round((completed / items.length) * 100);
    return { percent, text: `${completed}/${items.length}` };
  };

  const formatCalcValue = (val) => {
    if (val === null || val === undefined) return "-";
    const num = typeof val === "number" ? val : parseFloat(val);
    if (isNaN(num)) return val;
    return Math.round(num);
  };

  // Funkcija gleda KADA JE NALOG POSLEDNJI PUT AŽURIRAN (tj. završen)
  const isWithin18Hours = (order) => {
    // Ako backend šalje updatedAt koristimo to, u suprotnom createdAt kao osigurač
    const timeToTrack = order.updatedAt || order.createdAt;
    if (!timeToTrack) return true;

    const lastUpdateDate = new Date(timeToTrack);
    const now = new Date();
    const diffHours = (now - lastUpdateDate) / (1000 * 60 * 60);
    return diffHours <= 18;
  };

  // Aktivni nalozi - Bilo šta što nije skroz završeno ostaje ovde
  const activeOrders = orders.filter(
    (o) => o.items && o.items.some((i) => i.status !== "COMPLETED"),
  );

  // Gotovi nalozi - Skroz završeni ALI mlađi od 18 sati od trenutka završetka!
  // Ako je prošlo 18 sati, ovaj filter ga blokira i nalog TRAJNO NESTAJE sa Kioska.
  const completedOrders = orders.filter(
    (o) =>
      o.items &&
      o.items.length > 0 &&
      o.items.every((i) => i.status === "COMPLETED") &&
      isWithin18Hours(o),
  );

  const currentOrdersList =
    viewMode === "ACTIVE" ? activeOrders : completedOrders;

  const filteredAndSortedOrders = currentOrdersList
    .filter((order) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesName =
        order.customerName &&
        order.customerName.toLowerCase().includes(searchLower);
      const matchesProtocol =
        order.protocolNumber &&
        order.protocolNumber.toLowerCase().includes(searchLower);
      return matchesName || matchesProtocol;
    })
    .sort((a, b) => (b.isUrgent ? 1 : 0) - (a.isUrgent ? 1 : 0));

  const hasIncompleteMeshes = selectedOrder?.items?.some(
    (i) => i.status === "NEW" || i.status === "IN_PROGRESS",
  );
  const hasIncompleteItems = selectedOrder?.items?.some(
    (i) => i.status !== "COMPLETED",
  );

  return (
    <div
      className="d-flex flex-column"
      style={{
        minHeight: "100vh",
        backgroundColor: viewMode === "ACTIVE" ? "#e9ecef" : "#d1e7dd",
      }}
    >
      <div
        className={`text-white p-3 d-flex justify-content-between align-items-center shadow gap-3 flex-wrap ${viewMode === "ACTIVE" ? "bg-dark" : "bg-success"}`}
      >
        <h2 className="m-0 fw-bold text-nowrap">
          {viewMode === "ACTIVE" ? "🛠️ ALUMAX KIOSK" : "✅ ZAVRŠENI NALOZI"}
        </h2>

        <div className="flex-grow-1 mx-md-4" style={{ maxWidth: "400px" }}>
          <input
            type="text"
            className="form-control form-control-lg bg-light text-dark border-0"
            placeholder="🔍 Pretraži kupca ili nalog..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="d-flex gap-3 align-items-center">
          <button
            className={`btn fw-bold px-4 shadow ${viewMode === "COMPLETED" ? "btn-dark" : "btn-success"}`}
            onClick={() => {
              setViewMode(viewMode === "ACTIVE" ? "COMPLETED" : "ACTIVE");
              setSearchTerm("");
              setSelectedOrder(null);
            }}
          >
            {viewMode === "ACTIVE" ? "✅ GOTOVI NALOZI" : "🔙 NAZAD NA KIOSK"}
          </button>

          <span
            className="fs-5 fw-bold border-start ps-3 border-end pe-3 d-none d-md-inline"
            style={{ color: viewMode === "ACTIVE" ? "#0dcaf0" : "#fff" }}
          >
            👤 {JSON.parse(localStorage.getItem("user"))?.username}
          </span>
          <button
            className="btn btn-outline-light fw-bold px-3 d-none d-md-block"
            onClick={fetchOrders}
          >
            🔄 OSVEŽI
          </button>
          <button
            className="btn btn-danger fw-bold px-3 shadow"
            onClick={handleLogout}
          >
            🚪 ODJAVI SE
          </button>
        </div>
      </div>

      <div className="flex-grow-1 p-4 overflow-auto position-relative">
        <div className="row g-4">
          {filteredAndSortedOrders.length > 0 ? (
            filteredAndSortedOrders.map((order) => {
              const progress = getOrderProgress(order.items);
              return (
                <div key={order.id} className="col-md-6 col-lg-4 col-xl-3">
                  <div
                    className={`card h-100 shadow-sm border-0 rounded-4 overflow-hidden ${order.isUrgent ? "border-danger" : viewMode === "COMPLETED" ? "border-success" : "border-primary"}`}
                    style={{
                      cursor: "pointer",
                      borderStart: "8px solid",
                      borderLeft: `8px solid ${order.isUrgent ? "#dc3545" : viewMode === "COMPLETED" ? "#198754" : "#0d6efd"}`,
                    }}
                    onClick={() => handleOpenOrder(order)}
                  >
                    <div
                      className={`card-header border-0 ${order.isUrgent ? "bg-danger text-white" : viewMode === "COMPLETED" ? "bg-success text-white" : "bg-light"}`}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="fw-bold mb-0">
                          Nalog #{order.protocolNumber || "N/A"}
                        </h5>
                        {order.isUrgent && (
                          <span
                            className={`badge fw-bold shadow-sm fs-6 ${viewMode === "COMPLETED" ? "bg-white text-success" : "bg-white text-danger"}`}
                          >
                            🔥 HITNO
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="card-body p-4 d-flex flex-column justify-content-center">
                      <h4 className="fw-bold text-dark mb-2 text-center">
                        {order.customerName}
                      </h4>

                      <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                        <span className="text-muted fw-bold">
                          Boja profila:
                        </span>
                        <span className="fw-bold text-dark">
                          {order.profileColor || "Standard"}
                        </span>
                      </div>

                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted fw-bold">Za kad:</span>
                        <span className="fw-bold text-primary">
                          {order.deliveryDate || "Nije definisano"}
                        </span>
                      </div>

                      {order.deliveryAddress && order.requiresDelivery && (
                        <div className="alert alert-warning p-2 mt-2 mb-0 small fw-bold">
                          Isporuka: {order.deliveryAddress}
                        </div>
                      )}

                      <div className="mt-4">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="small fw-bold text-muted">
                            Progres:
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
                            className={`progress-bar progress-bar-striped progress-bar-animated ${progress.percent === 100 ? "bg-success" : "bg-primary"}`}
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
                {viewMode === "ACTIVE"
                  ? "Nema pronađenih aktivnih naloga. Sto je čist! 🍺"
                  : "Trenutno nema završenih naloga (stariji od 18 sati su uklonjeni)."}
              </h2>
            </div>
          )}
        </div>
      </div>

      {loadingCalcs && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 2000 }}
        >
          <div
            className="spinner-border text-light mb-3"
            style={{ width: "4rem", height: "4rem" }}
            role="status"
          ></div>
          <h3 className="text-white fw-bold">Molim sačekajte...</h3>
        </div>
      )}

      {selectedOrder && !loadingCalcs && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.85)", zIndex: 1050 }}
        >
          <div
            className="card shadow-lg border-0 rounded-4 d-flex flex-column"
            style={{ width: "98%", height: "98vh" }}
          >
            <div
              className={`card-header p-3 d-flex justify-content-between align-items-center rounded-top-4 ${selectedOrder.isUrgent ? "bg-danger" : viewMode === "COMPLETED" ? "bg-success" : "bg-dark"} text-white`}
            >
              <div>
                <h3 className="m-0 fw-bold">
                  Nalog #{selectedOrder.protocolNumber || "N/A"} -{" "}
                  {selectedOrder.customerName}
                </h3>
                <span className="fs-5 opacity-75">
                  Boja profila:{" "}
                  <strong className="text-warning">
                    {selectedOrder.profileColor || "Nema"}
                  </strong>{" "}
                  | Rok:{" "}
                  <strong className="text-info">
                    {selectedOrder.deliveryDate || "Nema"}
                  </strong>
                </span>
              </div>
              <button
                className="btn btn-lg btn-outline-light fw-bold px-5"
                onClick={() => setSelectedOrder(null)}
              >
                ZATVORI
              </button>
            </div>

            <div className="card-body p-0 overflow-auto bg-light d-flex flex-column">
              <table
                className="table table-bordered table-hover align-middle m-0 flex-grow-1"
                style={{ borderCollapse: "collapse" }}
              >
                <thead
                  className="table-secondary sticky-top shadow-sm border-dark text-center align-middle"
                  style={{ borderBottom: "3px solid #333" }}
                >
                  <tr>
                    <th
                      rowSpan="2"
                      className="py-3 px-2 border-dark"
                      style={{ width: "50px" }}
                    >
                      Red.
                      <br />
                      broj
                    </th>
                    <th
                      rowSpan="2"
                      className="py-3 border-dark text-primary fs-5"
                      style={{ width: "90px" }}
                    >
                      Širina
                      <br />
                      <span className="fs-6 text-muted fw-normal">(mm)</span>
                    </th>
                    <th
                      rowSpan="2"
                      className="py-3 border-dark text-primary fs-5"
                      style={{ width: "90px" }}
                    >
                      Visina
                      <br />
                      <span className="fs-6 text-muted fw-normal">(mm)</span>
                    </th>
                    <th
                      rowSpan="2"
                      className="py-3 border-dark"
                      style={{ width: "70px" }}
                    >
                      Kom.
                    </th>
                    <th
                      colSpan="3"
                      className="py-2 border-dark bg-info bg-opacity-25 fs-5"
                    >
                      ✂️ KROJNA LISTA (Dimenzije u mm / Broj rupe)
                    </th>
                    <th
                      rowSpan="2"
                      className="py-3 border-dark"
                      style={{ width: "120px" }}
                    >
                      Napomene
                    </th>
                    <th
                      rowSpan="2"
                      className="py-3 border-dark"
                      style={{ width: "240px" }}
                    >
                      Akcija
                    </th>
                  </tr>
                  <tr>
                    <th className="py-2 border-dark bg-light text-muted">
                      PROFILI
                    </th>
                    <th className="py-2 border-dark bg-light text-muted">
                      MREŽICA & TRAKA
                    </th>
                    <th className="py-2 border-dark bg-light text-muted">
                      KANAP, RUPE & RAZMAK
                    </th>
                  </tr>
                </thead>
                <tbody className="fs-5 fw-medium">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, idx) => {
                      const profili = [];
                      const mrezice = [];
                      const kanapi = [];

                      if (item.calculations) {
                        item.calculations.forEach((calc) => {
                          const name = (calc.elementName || "").toLowerCase();
                          if (
                            name.includes("kanap") ||
                            name.includes("rup") ||
                            name.includes("razmak") ||
                            name.includes("set")
                          ) {
                            kanapi.push(calc);
                          } else if (
                            name.includes("mrež") ||
                            name.includes("mrez") ||
                            name.includes("traka") ||
                            name.includes("reb")
                          ) {
                            mrezice.push(calc);
                          } else {
                            profili.push(calc);
                          }
                        });
                      }

                      return (
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
                          <td className="px-2 fw-bold text-center border-dark">
                            {idx + 1}.
                          </td>
                          <td className="text-center fw-bold fs-4 border-dark">
                            {formatCalcValue(item.widthW)}
                          </td>
                          <td className="text-center fw-bold fs-4 border-dark">
                            {formatCalcValue(item.heightH)}
                          </td>
                          <td className="fw-bold fs-3 text-center text-primary border-dark bg-light">
                            {item.quantity}
                          </td>

                          <td className="border-dark p-2">
                            {item.type === "SERVICE" ? (
                              <span className="badge bg-warning text-dark">
                                SERVIS
                              </span>
                            ) : (
                              profili.map((p, i) => (
                                <div
                                  key={i}
                                  className="d-flex justify-content-between border-bottom border-light mb-1"
                                >
                                  <span className="small text-muted">
                                    {p.quantity}x {p.elementName}:
                                  </span>
                                  <strong className="text-dark ms-2">
                                    {formatCalcValue(p.resultValue)}
                                  </strong>
                                </div>
                              ))
                            )}
                          </td>

                          <td className="border-dark p-2">
                            {mrezice.map((m, i) => (
                              <div
                                key={i}
                                className="d-flex justify-content-between border-bottom border-light mb-1"
                              >
                                <span className="small text-muted">
                                  {m.quantity ? `${m.quantity}x ` : ""}
                                  {m.elementName}:
                                </span>
                                <strong className="text-primary ms-2">
                                  {formatCalcValue(m.resultValue)}
                                </strong>
                              </div>
                            ))}
                          </td>

                          <td className="border-dark p-2">
                            {kanapi.map((k, i) => (
                              <div
                                key={i}
                                className="d-flex justify-content-between border-bottom border-light mb-1"
                              >
                                <span className="small text-muted">
                                  {k.elementName}:
                                </span>
                                <strong className="text-success ms-2">
                                  {formatCalcValue(k.resultValue)}
                                </strong>
                              </div>
                            ))}
                          </td>

                          <td className="text-center border-dark p-2">
                            {item.fullNote ? (
                              <button
                                className="btn btn-sm btn-outline-danger fw-bold w-100 py-2"
                                onClick={() =>
                                  setNotesModal({
                                    isOpen: true,
                                    text: item.fullNote,
                                  })
                                }
                              >
                                ⚠️ VIDI NAPOMENU
                              </button>
                            ) : (
                              <span className="text-muted small">-</span>
                            )}
                          </td>

                          <td className="p-2 border-dark align-middle">
                            {item.status === "COMPLETED" ? (
                              <div className="d-flex flex-column gap-2 h-100 justify-content-center">
                                <div className="bg-success text-white fw-bold text-center rounded py-2 w-100 fs-5 shadow-sm">
                                  ZAVRŠENO
                                </div>
                                <button
                                  className="btn btn-sm btn-outline-danger fw-bold shadow-sm"
                                  onClick={() =>
                                    handleStatusChange(item.id, "IN_PROGRESS")
                                  }
                                >
                                  ↩️ VRATI U RAD
                                </button>
                              </div>
                            ) : (
                              <div className="d-flex gap-2 justify-content-center h-100">
                                <button
                                  className={`btn fw-bold flex-fill py-2 shadow-sm d-flex flex-column align-items-center justify-content-center ${item.status === "READY_FOR_ASSEMBLY" ? "btn-secondary opacity-50" : "btn-warning text-dark"}`}
                                  onClick={() =>
                                    handleStatusChange(
                                      item.id,
                                      "READY_FOR_ASSEMBLY",
                                    )
                                  }
                                  disabled={
                                    item.status === "READY_FOR_ASSEMBLY"
                                  }
                                >
                                  <span className="fs-4 mb-1">🧵</span>
                                  <span className="small">MREŽICA</span>
                                </button>

                                <button
                                  className="btn btn-success fw-bold flex-fill py-2 shadow-sm d-flex flex-column align-items-center justify-content-center"
                                  onClick={() =>
                                    handleStatusChange(item.id, "COMPLETED")
                                  }
                                >
                                  <span className="fs-4 mb-1">✅</span>
                                  <span className="small">GOTOVO</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-5 text-muted">
                        Nema stavki u nalogu.
                      </td>
                    </tr>
                  )}
                </tbody>

                {hasIncompleteItems && viewMode === "ACTIVE" && (
                  <tfoot className="table-light mt-auto">
                    <tr>
                      <td
                        colSpan="9"
                        className="p-3 border-dark border-top-3 border-3"
                      >
                        <div className="d-flex justify-content-end align-items-center gap-3">
                          <span className="fw-bold text-muted me-3 fs-5">
                            ZAVRŠI CIKLUS ZA SVE:
                          </span>

                          <button
                            className="btn btn-warning text-dark fw-bold btn-lg shadow px-4"
                            onClick={() =>
                              handleBulkStatusChange("READY_FOR_ASSEMBLY")
                            }
                            disabled={!hasIncompleteMeshes}
                          >
                            🧵 ZAVRŠI SVE MREŽICE
                          </button>

                          <button
                            className="btn btn-success fw-bold btn-lg shadow px-4"
                            onClick={() => handleBulkStatusChange("COMPLETED")}
                          >
                            ✅ ZAVRŠENO SVE (SPAKOVANO)
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {notesModal.isOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 3000 }}
        >
          <div
            className="card shadow-lg border-0 rounded-4"
            style={{ width: "90%", maxWidth: "450px" }}
          >
            <div className="card-header bg-warning text-dark p-3 text-center border-0 rounded-top-4">
              <h4 className="fw-bold m-0">⚠️ Napomene za stavku</h4>
            </div>
            <div
              className="card-body p-4 bg-white fs-5"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {notesModal.text}
            </div>
            <div className="card-footer bg-light p-3 border-0 rounded-bottom-4">
              <button
                className="btn btn-lg btn-dark w-100 fw-bold shadow-sm"
                onClick={() => setNotesModal({ isOpen: false, text: "" })}
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KioskLayout;
