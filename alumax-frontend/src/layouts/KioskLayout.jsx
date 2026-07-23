import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getWorkOrders,
  updateOrderItemStatus,
  getItemCalculations,
  updateOrderItem,
} from "../api/api";

const PREDEFINED_SERVICES = [
  "Novi magneti",
  "Štelovanje zatezača",
  "Zamena kanapa",
  "Zamena mrežice",
  "Zamena točkića",
];

function KioskLayout() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingCalcs, setLoadingCalcs] = useState(false);
  const [viewMode, setViewMode] = useState("ACTIVE");
  const [notesModal, setNotesModal] = useState({ isOpen: false, text: "" });

  const [serviceModal, setServiceModal] = useState({
    isOpen: false,
    item: null,
    selected: [],
    extraNote: "",
  });

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

  const submitServiceCompletion = async () => {
    if (!serviceModal.item) return;
    setLoadingCalcs(true);

    try {
      const doneList = serviceModal.selected.join(", ");
      const additional = serviceModal.extraNote.trim();
      let appendedNote =
        "✅ ODRAĐENO U SERVISU: " + (doneList || "Ništa nije štiklirano.");
      if (additional) {
        appendedNote += "\nDodatno: " + additional;
      }

      const oldNote = serviceModal.item.note || "";
      const updatedNote = oldNote
        ? oldNote + "\n\n" + appendedNote
        : appendedNote;

      if (updateOrderItem) {
        try {
          await updateOrderItem(serviceModal.item.id, {
            ...serviceModal.item,
            note: updatedNote,
          });
        } catch (e) {
          console.warn(
            "API za azuriranje stavke verovatno nije implementiran.",
            e,
          );
        }
      }

      await updateOrderItemStatus(serviceModal.item.id, "COMPLETED");

      setSelectedOrder((prev) => {
        if (!prev) return prev;
        const updatedItems = prev.items.map((i) =>
          i.id === serviceModal.item.id
            ? {
                ...i,
                status: "COMPLETED",
                note: updatedNote,
                fullNote: updatedNote,
              }
            : i,
        );
        return { ...prev, items: updatedItems };
      });

      setServiceModal({
        isOpen: false,
        item: null,
        selected: [],
        extraNote: "",
      });
      fetchOrders();
    } catch (error) {
      console.error("Greška pri završavanju servisa:", error);
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

  const hasService = (order) =>
    order.items && order.items.some((i) => i.type === "SERVICE");
  const isServiceOnly = (order) =>
    order.items &&
    order.items.length > 0 &&
    order.items.every((i) => i.type === "SERVICE");
  const isCompleted = (order) =>
    order.items &&
    order.items.length > 0 &&
    order.items.every((i) => i.status === "COMPLETED");

  const activeOrders = orders.filter(
    (o) => !isCompleted(o) && !isServiceOnly(o),
  );
  const serviceOrders = orders.filter(
    (o) => !isCompleted(o) && isServiceOnly(o),
  );
  const completedOrders = orders.filter((o) => isCompleted(o));

  let currentOrdersList = [];
  if (viewMode === "ACTIVE") currentOrdersList = activeOrders;
  else if (viewMode === "SERVICES") currentOrdersList = serviceOrders;
  else if (viewMode === "COMPLETED") currentOrdersList = completedOrders;

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
    .sort((a, b) => {
      if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

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
        backgroundColor:
          viewMode === "ACTIVE"
            ? "#e9ecef"
            : viewMode === "SERVICES"
              ? "#fff3cd"
              : "#d1e7dd",
      }}
    >
      <div
        className={`text-white p-3 d-flex justify-content-between align-items-center shadow gap-3 flex-wrap ${viewMode === "ACTIVE" ? "bg-dark" : viewMode === "SERVICES" ? "bg-warning text-dark" : "bg-success"}`}
      >
        <h2 className="m-0 fw-bold text-nowrap">
          {viewMode === "ACTIVE"
            ? "🛠️ ALUMAX KIOSK"
            : viewMode === "SERVICES"
              ? "🔧 SAMO SERVISI"
              : "✅ ZAVRŠENI NALOZI"}
        </h2>
        <div className="flex-grow-1 mx-md-4" style={{ maxWidth: "400px" }}>
          <input
            type="text"
            className={`form-control form-control-lg border-0 ${viewMode === "SERVICES" ? "bg-white" : "bg-light text-dark"}`}
            placeholder="🔍 Pretraži kupca ili nalog..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="d-flex gap-2 align-items-center">
          {viewMode !== "ACTIVE" ? (
            <button
              className="btn btn-dark fw-bold px-3 shadow"
              onClick={() => {
                setViewMode("ACTIVE");
                setSearchTerm("");
                setSelectedOrder(null);
              }}
            >
              🔙 NAZAD NA KIOSK
            </button>
          ) : (
            <>
              <button
                className="btn btn-warning text-dark fw-bold px-3 shadow"
                onClick={() => {
                  setViewMode("SERVICES");
                  setSearchTerm("");
                  setSelectedOrder(null);
                }}
              >
                🔧 SERVISI
              </button>
              <button
                className="btn btn-success fw-bold px-3 shadow"
                onClick={() => {
                  setViewMode("COMPLETED");
                  setSearchTerm("");
                  setSelectedOrder(null);
                }}
              >
                ✅ GOTOVI
              </button>
            </>
          )}

          <span
            className="fs-5 fw-bold border-start ps-3 border-end pe-3 d-none d-md-inline"
            style={{
              color:
                viewMode === "ACTIVE"
                  ? "#0dcaf0"
                  : viewMode === "SERVICES"
                    ? "#000"
                    : "#fff",
            }}
          >
            👤 {JSON.parse(localStorage.getItem("user"))?.username}
          </span>
          <button
            className={`btn fw-bold px-3 d-none d-md-block ${viewMode === "SERVICES" ? "btn-outline-dark" : "btn-outline-light"}`}
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
                    className={`card h-100 shadow-sm border-0 rounded-4 overflow-hidden ${order.isUrgent ? "border-danger" : viewMode === "COMPLETED" ? "border-success" : viewMode === "SERVICES" ? "border-warning" : "border-primary"}`}
                    style={{
                      cursor: "pointer",
                      borderStart: "8px solid",
                      borderLeft: `8px solid ${order.isUrgent ? "#dc3545" : viewMode === "COMPLETED" ? "#198754" : viewMode === "SERVICES" ? "#ffc107" : "#0d6efd"}`,
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
                        <div className="d-flex gap-2">
                          {hasService(order) && (
                            <span
                              className={`badge fw-bold shadow-sm fs-6 bg-warning text-dark`}
                            >
                              🔧 SERVIS
                            </span>
                          )}
                          {order.isUrgent && (
                            <span
                              className={`badge fw-bold shadow-sm fs-6 ${viewMode === "COMPLETED" ? "bg-white text-success" : "bg-white text-danger"}`}
                            >
                              🔥 HITNO
                            </span>
                          )}
                        </div>
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
                  : viewMode === "SERVICES"
                    ? "Trenutno nema čistih servisnih naloga."
                    : "Trenutno nema završenih naloga."}
              </h2>
            </div>
          )}
        </div>
      </div>

      {loadingCalcs && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 4000 }}
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
              className={`card-header p-2 p-md-3 d-flex justify-content-between align-items-center rounded-top-4 ${selectedOrder.isUrgent ? "bg-danger" : viewMode === "COMPLETED" ? "bg-success" : "bg-dark"} text-white`}
            >
              <div>
                <h3 className="m-0 fw-bold fs-4 fs-md-3">
                  Nalog #{selectedOrder.protocolNumber || "N/A"} -{" "}
                  {selectedOrder.customerName}
                </h3>
                <span className="fs-6 opacity-75">
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
                className="btn btn-outline-light fw-bold px-4"
                onClick={() => setSelectedOrder(null)}
              >
                ZATVORI
              </button>
            </div>

            <div className="card-body p-0 overflow-auto bg-light d-flex flex-column">
              <div>
                <table
                  className="table table-bordered table-hover align-middle m-0"
                  style={{ borderCollapse: "collapse" }}
                >
                  <thead
                    className="table-secondary sticky-top shadow-sm border-dark text-center align-middle"
                    style={{ borderBottom: "3px solid #333" }}
                  >
                    <tr>
                      <th
                        rowSpan="2"
                        className="py-1 px-1 border-dark small"
                        style={{ width: "40px" }}
                      >
                        Red.
                        <br />
                        broj
                      </th>
                      <th
                        rowSpan="2"
                        className="py-1 border-dark text-primary small"
                        style={{ width: "80px" }}
                      >
                        Širina
                        <br />
                        <span className="small text-muted fw-normal">(mm)</span>
                      </th>
                      <th
                        rowSpan="2"
                        className="py-1 border-dark text-primary small"
                        style={{ width: "80px" }}
                      >
                        Visina
                        <br />
                        <span className="small text-muted fw-normal">(mm)</span>
                      </th>
                      <th
                        rowSpan="2"
                        className="py-1 border-dark small"
                        style={{ width: "60px" }}
                      >
                        Kom.
                      </th>
                      {/* OVDJE JE PROMENJENO DA BUDE NEPROVIDNO PLAVO (table-info) */}
                      <th
                        colSpan="3"
                        className="py-1 border-dark table-info small"
                      >
                        ✂️ KROJNA LISTA
                      </th>
                      <th
                        rowSpan="2"
                        className="py-1 border-dark small"
                        style={{ width: "100px" }}
                      >
                        Napomene
                      </th>
                      <th
                        rowSpan="2"
                        className="py-1 border-dark small"
                        style={{ width: "180px" }}
                      >
                        Akcija
                      </th>
                    </tr>
                    <tr>
                      {/* OVDJE JE PROMENJENO U table-light DA BUDE CVRSTA BOJA */}
                      <th
                        className="py-1 border-dark table-light text-muted small"
                        style={{ borderRight: "2px dashed #ced4da" }}
                      >
                        PROFILI
                      </th>
                      <th
                        className="py-1 border-dark table-light text-muted small"
                        style={{ borderRight: "2px dashed #ced4da" }}
                      >
                        MREŽICA & TRAKA
                      </th>
                      <th className="py-1 border-dark table-light text-muted small">
                        KANAP, RUPE & RAZMAK
                      </th>
                    </tr>
                  </thead>
                  <tbody className="fw-medium" style={{ fontSize: "0.95rem" }}>
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item, idx) => {
                        const isService = item.type === "SERVICE";
                        const profili = [];
                        const mrezice = [];
                        const kanapi = [];

                        if (!isService && item.calculations) {
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
                              item.status === "COMPLETED"
                                ? "bg-white text-muted"
                                : "bg-white text-dark"
                            }
                            style={{ borderBottom: "3px solid #333" }}
                          >
                            <td className="px-1 py-1 fw-bold text-center border-dark align-middle">
                              <div className="d-flex flex-column align-items-center justify-content-center gap-1">
                                <span>{idx + 1}.</span>
                                {item.status === "COMPLETED" && (
                                  <span
                                    className="badge bg-success rounded-pill"
                                    title="Završeno"
                                  >
                                    ✅
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="text-center fw-bold border-dark align-middle">
                              {formatCalcValue(item.widthW)}
                            </td>
                            <td className="text-center fw-bold border-dark align-middle">
                              {formatCalcValue(item.heightH)}
                            </td>
                            <td className="fw-bold text-center text-primary border-dark bg-light align-middle">
                              {item.quantity}
                            </td>

                            {isService ? (
                              <td
                                colSpan="4"
                                className="border-dark p-2 text-center align-middle"
                              >
                                <span className="badge bg-warning text-dark fs-6 mb-2">
                                  🔧 SERVIS
                                </span>
                                <div
                                  className="fw-bold"
                                  style={{
                                    whiteSpace: "pre-wrap",
                                    fontSize: "1rem",
                                  }}
                                >
                                  {item.fullNote ||
                                    item.note ||
                                    "- Nema definisane napomene za ovaj servis -"}
                                </div>
                              </td>
                            ) : (
                              <>
                                <td
                                  className="border-dark p-1 align-middle"
                                  style={{ borderRight: "2px dashed #ced4da" }}
                                >
                                  {profili.map((p, i) => (
                                    <div
                                      key={i}
                                      className="d-flex justify-content-between pb-1 mb-1"
                                      style={{
                                        borderBottom:
                                          i < profili.length - 1
                                            ? "1px dashed #a8a8a8"
                                            : "none",
                                      }}
                                    >
                                      <span className="small opacity-75">
                                        {p.quantity}x {p.elementName}:
                                      </span>
                                      <strong className="ms-1">
                                        {formatCalcValue(p.resultValue)}
                                      </strong>
                                    </div>
                                  ))}
                                </td>
                                <td
                                  className="border-dark p-1 align-middle"
                                  style={{ borderRight: "2px dashed #ced4da" }}
                                >
                                  {mrezice.map((m, i) => (
                                    <div
                                      key={i}
                                      className="d-flex justify-content-between pb-1 mb-1"
                                      style={{
                                        borderBottom:
                                          i < mrezice.length - 1
                                            ? "1px dashed #a8a8a8"
                                            : "none",
                                      }}
                                    >
                                      <span className="small opacity-75">
                                        {m.quantity ? `${m.quantity}x ` : ""}
                                        {m.elementName}:
                                      </span>
                                      <strong
                                        className={
                                          item.status === "COMPLETED"
                                            ? ""
                                            : "text-primary ms-1"
                                        }
                                      >
                                        {formatCalcValue(m.resultValue)}
                                      </strong>
                                    </div>
                                  ))}
                                </td>
                                <td className="border-dark p-1 align-middle">
                                  {kanapi.map((k, i) => (
                                    <div
                                      key={i}
                                      className="d-flex justify-content-between pb-1 mb-1"
                                      style={{
                                        borderBottom:
                                          i < kanapi.length - 1
                                            ? "1px dashed #a8a8a8"
                                            : "none",
                                      }}
                                    >
                                      <span className="small opacity-75">
                                        {k.elementName}:
                                      </span>
                                      <strong
                                        className={
                                          item.status === "COMPLETED"
                                            ? ""
                                            : "text-success ms-1"
                                        }
                                      >
                                        {formatCalcValue(k.resultValue)}
                                      </strong>
                                    </div>
                                  ))}
                                </td>
                                <td className="text-center border-dark p-1 align-middle">
                                  {item.fullNote ? (
                                    <button
                                      className="btn btn-sm btn-outline-danger fw-bold w-100 py-1"
                                      onClick={() =>
                                        setNotesModal({
                                          isOpen: true,
                                          text: item.fullNote,
                                        })
                                      }
                                    >
                                      ⚠️ VIDI
                                    </button>
                                  ) : (
                                    <span className="opacity-50 small">-</span>
                                  )}
                                </td>
                              </>
                            )}

                            <td className="p-1 border-dark align-middle text-center">
                              {item.status === "COMPLETED" ? (
                                <div className="d-flex justify-content-center align-items-center h-100">
                                  <button
                                    className="btn btn-sm btn-outline-secondary py-1 px-2 opacity-75"
                                    onClick={() =>
                                      handleStatusChange(item.id, "IN_PROGRESS")
                                    }
                                    title="Vrati nalog u rad"
                                  >
                                    <small>↩️ Vrati u rad</small>
                                  </button>
                                </div>
                              ) : isService ? (
                                <div className="d-flex h-100 align-items-center">
                                  <button
                                    className="btn btn-warning text-dark fw-bold w-100 shadow-sm py-2"
                                    onClick={() =>
                                      setServiceModal({
                                        isOpen: true,
                                        item,
                                        selected: [],
                                        extraNote: "",
                                      })
                                    }
                                  >
                                    🛠️ ZAVRŠI SERVIS
                                  </button>
                                </div>
                              ) : (
                                <div className="d-flex gap-1 justify-content-center h-100">
                                  <button
                                    className={`btn fw-bold flex-fill py-1 shadow-sm d-flex flex-column align-items-center justify-content-center ${item.status === "READY_FOR_ASSEMBLY" ? "btn-secondary opacity-50" : "btn-warning text-dark"}`}
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
                                    <span className="fs-5 mb-0">🧵</span>
                                    <span style={{ fontSize: "0.7rem" }}>
                                      MREŽICA
                                    </span>
                                  </button>
                                  <button
                                    className="btn btn-success fw-bold flex-fill py-1 shadow-sm d-flex flex-column align-items-center justify-content-center"
                                    onClick={() =>
                                      handleStatusChange(item.id, "COMPLETED")
                                    }
                                  >
                                    <span className="fs-5 mb-0">✅</span>
                                    <span style={{ fontSize: "0.7rem" }}>
                                      GOTOVO
                                    </span>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center py-4 text-muted">
                          Nema stavki u nalogu.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {hasIncompleteItems && viewMode === "ACTIVE" && (
                <div className="p-2 bg-light border-top border-dark border-3 sticky-bottom shadow-sm mt-auto">
                  <div className="d-flex justify-content-end align-items-center gap-2">
                    <span className="fw-bold text-muted me-2">
                      ZAVRŠI CIKLUS ZA SVE:
                    </span>
                    <button
                      className="btn btn-warning text-dark fw-bold shadow px-3"
                      onClick={() =>
                        handleBulkStatusChange("READY_FOR_ASSEMBLY")
                      }
                      disabled={!hasIncompleteMeshes}
                    >
                      🧵 ZAVRŠI SVE MREŽICE
                    </button>
                    <button
                      className="btn btn-success fw-bold shadow px-3"
                      onClick={() => handleBulkStatusChange("COMPLETED")}
                    >
                      ✅ ZAVRŠENO SVE (SPAKOVANO)
                    </button>
                  </div>
                </div>
              )}
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
              className="card-body p-4 bg-white fs-6"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {notesModal.text}
            </div>
            <div className="card-footer bg-light p-3 border-0 rounded-bottom-4">
              <button
                className="btn btn-dark w-100 fw-bold shadow-sm"
                onClick={() => setNotesModal({ isOpen: false, text: "" })}
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}

      {serviceModal.isOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 3000 }}
        >
          <div
            className="card shadow-lg border-0 rounded-4"
            style={{ width: "90%", maxWidth: "500px" }}
          >
            <div className="card-header bg-warning text-dark p-3 text-center border-0 rounded-top-4">
              <h4 className="fw-bold m-0">🛠️ Šta je odrađeno u servisu?</h4>
            </div>
            <div className="card-body p-4 bg-white">
              <p className="text-muted fw-bold mb-3 border-bottom pb-2">
                Štikliraj sve akcije koje su primenjene na ovoj stavci:
              </p>

              <div className="d-flex flex-column gap-2 mb-4">
                {PREDEFINED_SERVICES.map((serviceName, i) => (
                  <label
                    key={i}
                    className="d-flex align-items-center gap-3 p-2 border rounded"
                    style={{ cursor: "pointer" }}
                  >
                    <input
                      type="checkbox"
                      className="form-check-input"
                      style={{
                        width: "25px",
                        height: "25px",
                        cursor: "pointer",
                      }}
                      checked={serviceModal.selected.includes(serviceName)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setServiceModal((prev) => ({
                            ...prev,
                            selected: [...prev.selected, serviceName],
                          }));
                        } else {
                          setServiceModal((prev) => ({
                            ...prev,
                            selected: prev.selected.filter(
                              (s) => s !== serviceName,
                            ),
                          }));
                        }
                      }}
                    />
                    <span className="fw-bold fs-5">{serviceName}</span>
                  </label>
                ))}
              </div>

              <div className="form-group">
                <label className="fw-bold mb-1">
                  Dodatna napomena (opciono):
                </label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Upiši ako si radio još nešto..."
                  value={serviceModal.extraNote}
                  onChange={(e) =>
                    setServiceModal((prev) => ({
                      ...prev,
                      extraNote: e.target.value,
                    }))
                  }
                ></textarea>
              </div>
            </div>
            <div className="card-footer bg-light p-3 border-0 rounded-bottom-4 d-flex gap-2">
              <button
                className="btn btn-secondary fw-bold flex-fill shadow-sm"
                onClick={() =>
                  setServiceModal({
                    isOpen: false,
                    item: null,
                    selected: [],
                    extraNote: "",
                  })
                }
              >
                Odustani
              </button>
              <button
                className="btn btn-success fw-bold flex-fill shadow-sm"
                onClick={submitServiceCompletion}
              >
                ✅ Sačuvaj i završi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KioskLayout;
