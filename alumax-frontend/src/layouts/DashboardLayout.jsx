import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import {
  getWorkOrders,
  getItemCalculations,
  updateOrderItemStatus,
  createWorkOrder,
} from "../api/api";

function DashboardLayout() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState("ALL");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingCalcs, setLoadingCalcs] = useState(false);
  const [notesModal, setNotesModal] = useState({ isOpen: false, text: "" });

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(), 15000);
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

  let pendingItems = 0;
  let inProgressItems = 0;
  let completedItems = 0;
  let urgentOrdersCount = 0;

  orders.forEach((order) => {
    if (
      order.isUrgent &&
      (!order.items || order.items.some((i) => i.status !== "COMPLETED"))
    ) {
      urgentOrdersCount++;
    }
    if (order.items) {
      order.items.forEach((item) => {
        if (item.status === "NEW") pendingItems++;
        else if (item.status === "COMPLETED") completedItems++;
        else inProgressItems++;
      });
    }
  });

  const filteredOrders = orders
    .filter((o) => {
      const s = searchTerm.toLowerCase();
      const matchesSearch =
        (o.customerName && o.customerName.toLowerCase().includes(s)) ||
        (o.protocolNumber && o.protocolNumber.toLowerCase().includes(s));

      if (!matchesSearch) return false;

      if (filterMode === "URGENT") return o.isUrgent;
      if (filterMode === "SERVICES")
        return o.items && o.items.some((i) => i.type === "SERVICE");
      if (filterMode === "DELIVERY") return o.requiresDelivery;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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

  const handleRevertItem = async (itemId) => {
    const reason = window.prompt(
      "Unesite razlog vraćanja u rad (npr. Pogrešna mera, oštećenje...):",
    );
    if (reason === null) return;

    try {
      await updateOrderItemStatus(itemId, "NEW");
      alert(`Stavka vraćena u rad!\nRazlog: ${reason || "Nije naveden"}`);

      setSelectedOrder((prev) => {
        if (!prev) return prev;
        const updatedItems = prev.items.map((i) =>
          i.id === itemId
            ? {
                ...i,
                status: "NEW",
                note: i.note
                  ? i.note + ` | KOREKCIJA: ${reason}`
                  : `KOREKCIJA: ${reason}`,
              }
            : i,
        );
        return { ...prev, items: updatedItems };
      });
      fetchOrders();
    } catch (error) {
      console.error("Greška pri vraćanju u rad:", error);
      alert("Došlo je do greške.");
    }
  };

  const handleRevertEntireOrder = async () => {
    if (
      !window.confirm(
        "Da li ste sigurni da želite da vratite ceo nalog ponovo u radionicu?",
      )
    )
      return;
    setLoadingCalcs(true);
    try {
      await Promise.all(
        selectedOrder.items.map((item) =>
          updateOrderItemStatus(item.id, "NEW"),
        ),
      );
      alert("Ceo nalog je uspešno vraćen u rad!");
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingCalcs(false);
    }
  };

  const handleDuplicateOrder = async () => {
    if (
      !window.confirm(
        "Ova akcija će kreirati potpuno novi nalog za ovog kupca sa istim stavkama. Želite li da nastavite?",
      )
    )
      return;
    try {
      const duplicatedItems = selectedOrder.items.map((item) => ({
        type: item.type,
        quantity: item.quantity,
        widthW: item.widthW,
        heightH: item.heightH,
        openingDirection: item.openingDirection,
        note: `PONOVLJEN NALOG - ${item.note || ""}`,
        productTemplate: item.productTemplate
          ? { id: item.productTemplate.id }
          : null,
      }));

      const newOrderPayload = {
        customerName: selectedOrder.customerName,
        profileColor: selectedOrder.profileColor,
        deliveryDate: selectedOrder.deliveryDate,
        isUrgent: false,
        requiresDelivery: selectedOrder.requiresDelivery,
        deliveryAddress: selectedOrder.deliveryAddress,
        items: duplicatedItems,
      };

      await createWorkOrder(newOrderPayload);
      alert("Nalog je uspešno iskopiran i poslat u radionicu!");
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error("Greška pri kopiranju naloga:", error);
      alert("Došlo je do greške pri dupliranju.");
    }
  };

  const getOrderProgress = (items) => {
    if (!items || items.length === 0) return { percent: 0, text: "0/0" };
    const completed = items.filter((i) => i.status === "COMPLETED").length;
    const percent = Math.round((completed / items.length) * 100);
    return {
      percent,
      text: `${completed}/${items.length}`,
      isDone: percent === 100,
    };
  };

  const formatCalcValue = (val) => {
    if (val === null || val === undefined) return "-";
    const num = typeof val === "number" ? val : parseFloat(val);
    return isNaN(num) ? val : Math.round(num);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="badge bg-success w-100 fs-6 py-2">✅ ZAVRŠENO</span>
        );
      case "READY_FOR_ASSEMBLY":
        return (
          <span className="badge bg-warning text-dark w-100 fs-6 py-2">
            🧵 NA MREŽICI
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="badge bg-primary w-100 fs-6 py-2">⚙️ U RADU</span>
        );
      default:
        return (
          <span className="badge bg-secondary w-100 fs-6 py-2">
            ⏳ ČEKA NA RAD
          </span>
        );
    }
  };

  return (
    <div
      className="d-flex"
      style={{ minHeight: "100vh", backgroundColor: "#f4f6f9" }}
    >
      <Sidebar />

      <div className="flex-grow-1 p-4 overflow-auto">
        <h2 className="fw-bold text-dark mb-4">Pregled Proizvodnje</h2>

        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-3 border-start border-primary border-4 h-100">
              <div className="card-body py-3">
                <h6 className="text-muted fw-bold mb-1 text-uppercase small">
                  Čeka na rad
                </h6>
                <h3 className="fw-bold m-0 text-dark">
                  {pendingItems}{" "}
                  <span className="fs-6 text-muted fw-normal">stavki</span>
                </h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-3 border-start border-warning border-4 h-100">
              <div className="card-body py-3">
                <h6 className="text-muted fw-bold mb-1 text-uppercase small">
                  Trenutno u radu
                </h6>
                <h3 className="fw-bold m-0 text-dark">
                  {inProgressItems}{" "}
                  <span className="fs-6 text-muted fw-normal">stavki</span>
                </h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div
              className="card border-0 shadow-sm rounded-3 border-start border-danger border-4 h-100"
              style={{ backgroundColor: "#ffeef0" }}
            >
              <div className="card-body py-3">
                <h6 className="text-danger fw-bold mb-1 text-uppercase small">
                  Hitni Nalozi
                </h6>
                <h3 className="fw-bold m-0 text-danger">
                  {urgentOrdersCount}{" "}
                  <span className="fs-6 text-danger opacity-75 fw-normal">
                    naloga
                  </span>
                </h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-3 border-start border-success border-4 h-100">
              <div className="card-body py-3">
                <h6 className="text-muted fw-bold mb-1 text-uppercase small">
                  Završeno Ukupno
                </h6>
                <h3 className="fw-bold m-0 text-dark">
                  {completedItems}{" "}
                  <span className="fs-6 text-muted fw-normal">stavki</span>
                </h3>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap justify-content-between align-items-center bg-white p-3 rounded-3 shadow-sm mb-4 gap-3">
          <div className="flex-grow-1" style={{ maxWidth: "400px" }}>
            <input
              type="text"
              className="form-control bg-light border-0"
              placeholder="Pretraga kupca ili protokola..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="d-flex gap-2">
            <button
              className={`btn fw-bold ${filterMode === "ALL" ? "btn-dark" : "btn-outline-dark"}`}
              onClick={() => setFilterMode("ALL")}
            >
              Svi Nalozi
            </button>
            <button
              className={`btn fw-bold ${filterMode === "URGENT" ? "btn-danger" : "btn-outline-danger"}`}
              onClick={() => setFilterMode("URGENT")}
            >
              Hitno
            </button>
            <button
              className={`btn fw-bold ${filterMode === "SERVICES" ? "btn-warning text-dark" : "btn-outline-warning text-dark"}`}
              onClick={() => setFilterMode("SERVICES")}
            >
              Servisi
            </button>
            <button
              className={`btn fw-bold ${filterMode === "DELIVERY" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setFilterMode("DELIVERY")}
            >
              Za Isporuku
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3 shadow-sm overflow-hidden">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="py-3 px-4">Protokol</th>
                <th className="py-3">Naručilac</th>
                <th className="py-3">Rok Završetka</th>
                <th className="py-3">Oznake</th>
                <th className="py-3" style={{ width: "200px" }}>
                  Progres
                </th>
                <th className="py-3 text-end px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const progress = getOrderProgress(order.items);
                  const hasService =
                    order.items &&
                    order.items.some((i) => i.type === "SERVICE");

                  return (
                    <tr
                      key={order.id}
                      className={order.isUrgent ? "table-danger" : ""}
                      onClick={() => handleOpenOrder(order)} // KLIK NA CEO RED OTVARA NALOG
                      style={{ cursor: "pointer" }} // KURSOR POKAZUJE DA MOŽE DA SE KLIKNE
                    >
                      <td className="px-4 fw-bold">{order.protocolNumber}</td>
                      <td className="fw-bold text-dark">
                        {order.customerName}
                      </td>
                      <td className="fw-medium">{order.deliveryDate || "-"}</td>
                      <td>
                        <div className="d-flex gap-1">
                          {order.isUrgent && (
                            <span className="badge bg-danger">HITNO</span>
                          )}
                          {hasService && (
                            <span className="badge bg-warning text-dark">
                              SADRŽI SERVIS
                            </span>
                          )}
                          {order.requiresDelivery && (
                            <span className="badge bg-primary">ISPORUKA</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="small fw-bold text-muted">
                            {progress.text}
                          </span>
                          <div
                            className="progress flex-grow-1"
                            style={{ height: "6px" }}
                          >
                            <div
                              className={`progress-bar ${progress.isDone ? "bg-success" : "bg-primary"}`}
                              style={{ width: `${progress.percent}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="text-end px-4">
                        <div className="d-flex justify-content-end align-items-center gap-2">
                          <span
                            className={`badge ${progress.isDone ? "bg-success" : "bg-dark"} py-2 px-3 shadow-sm`}
                          >
                            {progress.isDone ? "✅ GOTOVO" : "🔄 OTVOREN"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    Nema rezultata za prikaz.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
          <h3 className="text-white fw-bold">Učitavam strukturu naloga...</h3>
        </div>
      )}

      {selectedOrder && !loadingCalcs && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.85)", zIndex: 1050 }}
        >
          <div
            className="card shadow-lg border-0 rounded-4"
            style={{ width: "98%", height: "98vh", maxHeight: "98vh" }}
          >
            <div
              className={`card-header p-3 d-flex justify-content-between align-items-center rounded-top-4 bg-dark text-white`}
            >
              <div>
                <h3 className="m-0 fw-bold">
                  Kontrola Naloga #{selectedOrder.protocolNumber || "N/A"} -{" "}
                  {selectedOrder.customerName}
                </h3>
                <span className="fs-5 opacity-75">
                  Boja profila:{" "}
                  <strong className="text-warning">
                    {selectedOrder.profileColor || "Nema"}
                  </strong>{" "}
                  | Kreirano:{" "}
                  <strong className="text-info">
                    {new Date(selectedOrder.createdAt).toLocaleDateString(
                      "sr-RS",
                    )}
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

            {/* OVDJE JE UKLONJEN flex-column I flex-grow-1 KAKO SE REDOVI NE BI RAZVLAČILI PREKO CELOG EKRANA */}
            <div className="card-body p-0 overflow-auto bg-light">
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
                      ✂️ KROJNA LISTA (Dimenzije u mm)
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
                      style={{ width: "200px" }}
                    >
                      Trenutni Status
                      <br />i Akcije
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
                        <tr key={item.id} className="bg-white">
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
                            {item.fullNote || item.note ? (
                              <button
                                className="btn btn-sm btn-outline-danger fw-bold w-100 py-2 text-wrap"
                                onClick={() =>
                                  setNotesModal({
                                    isOpen: true,
                                    text: item.fullNote || item.note,
                                  })
                                }
                              >
                                ⚠️ VIDI NAPOMENU
                              </button>
                            ) : (
                              <span className="text-muted small">-</span>
                            )}
                          </td>

                          <td className="p-2 border-dark align-middle text-center">
                            <div className="mb-2">
                              {getStatusBadge(item.status)}
                            </div>
                            <button
                              className="btn btn-sm btn-outline-danger fw-bold w-100 mt-1"
                              onClick={() => handleRevertItem(item.id)}
                            >
                              ↩️ Vrati u rad
                            </button>
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
              </table>

              {/* ADMIN DUGMAD ZA CEO NALOG - Pomerena izvan tfoot da budu odmah ispod redova */}
              <div className="p-3 bg-light border-top border-dark border-3 sticky-bottom shadow-sm">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold text-muted fs-5">
                    OPCIJE CELOG NALOGA:
                  </span>
                  <div className="d-flex gap-3">
                    <button
                      className="btn btn-danger fw-bold shadow px-4"
                      onClick={handleRevertEntireOrder}
                    >
                      ↩️ VRATI SVE STAVKE U RAD
                    </button>

                    <button
                      className="btn btn-primary fw-bold shadow px-4"
                      onClick={handleDuplicateOrder}
                    >
                      📋 DUPLIRAJ (PONOVI) OVAJ NALOG
                    </button>
                  </div>
                </div>
              </div>
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
              <h4 className="fw-bold m-0">⚠️ Detalji i Napomene</h4>
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

export default DashboardLayout;
