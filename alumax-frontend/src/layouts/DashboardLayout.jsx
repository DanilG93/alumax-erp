import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { getWorkOrders } from "../api/api";

function DashboardLayout() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

  // Stanje za modal za detalje/štampanje
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

  let totalNew = 0;
  let totalInProgress = 0;
  let totalCompleted = 0;
  let urgentCount = 0;

  orders.forEach((order) => {
    if (order.isUrgent) urgentCount++;
    if (order.items) {
      order.items.forEach((item) => {
        if (item.status === "NEW") totalNew++;
        if (
          item.status === "IN_PROGRESS" ||
          item.status === "READY_FOR_ASSEMBLY"
        )
          totalInProgress++;
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div
        className="d-flex"
        style={{ minHeight: "100vh", backgroundColor: "#f4f6f9" }}
      >
        {/* Ovom div-u dodajemo klasu "no-print" da se ceo interfejs sakrije pri štampanju */}
        <div className="no-print d-flex w-100">
          <Sidebar />

          <div className="flex-grow-1 p-4 p-md-5 overflow-auto">
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
                      <th className="py-3 text-end px-4">Akcije</th>
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
                                  order.items.some(
                                    (i) => i.type === "SERVICE",
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
                            <td className="text-end px-4 d-flex justify-content-end align-items-center gap-2">
                              <span
                                className={`badge rounded-1 fs-6 px-3 py-2 ${order.status === "COMPLETED" ? "bg-success" : "bg-dark"}`}
                              >
                                {order.status === "COMPLETED"
                                  ? "GOTOVO"
                                  : "OTVOREN"}
                              </span>
                              <button
                                className="btn btn-sm btn-outline-info fw-bold"
                                onClick={() => setSelectedOrder(order)}
                              >
                                📄 Detalji / Štampa
                              </button>
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
      </div>

      {/* OVERLAY MODAL I DEO ZA ŠTAMPANJE */}
      {selectedOrder && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1050 }}
        >
          <div
            className="card shadow-lg border-0 rounded-4 d-flex flex-column"
            style={{ width: "95%", maxWidth: "900px", maxHeight: "95vh" }}
          >
            {/* ZAGLAVLJE MODALA (Sakriva se na štampi) */}
            <div className="card-header bg-white p-4 d-flex justify-content-between align-items-center border-bottom rounded-top-4 no-print">
              <h4 className="fw-bold m-0 text-dark">Pregled Naloga</h4>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary fw-bold px-4"
                  onClick={handlePrint}
                >
                  🖨️ ŠTAMPAJ DOKUMENT
                </button>
                <button
                  className="btn btn-secondary fw-bold px-4"
                  onClick={() => setSelectedOrder(null)}
                >
                  ZATVORI
                </button>
              </div>
            </div>

            {/* SADRŽAJ KOJI SE ŠTAMPA (A4 Format) */}
            <div
              id="print-area"
              className="card-body overflow-auto p-4 p-md-5 bg-white rounded-bottom-4"
            >
              <div className="text-center mb-5 pb-3 border-bottom border-2 border-dark">
                <h1 className="fw-bold text-uppercase mb-2">
                  Radni Nalog / Otpremnica
                </h1>
                <h3 className="text-muted">
                  Protokol: #{selectedOrder.protocolNumber || "N/A"}
                </h3>
              </div>

              <div className="row mb-5 fs-5">
                <div className="col-6">
                  <p className="mb-2">
                    <strong>Naručilac:</strong> {selectedOrder.customerName}
                  </p>
                  <p className="mb-2">
                    <strong>Boja profila:</strong>{" "}
                    {selectedOrder.profileColor || "Nije navedena"}
                  </p>
                  {selectedOrder.isUrgent && (
                    <p className="mb-2 text-danger fw-bold">Hitan Nalog!</p>
                  )}
                </div>
                <div className="col-6 text-end">
                  <p className="mb-2">
                    <strong>Datum isporuke:</strong>{" "}
                    {selectedOrder.deliveryDate || "-"}
                  </p>
                  <p className="mb-2">
                    <strong>Adresa isporuke:</strong>{" "}
                    {selectedOrder.requiresDelivery
                      ? selectedOrder.deliveryAddress
                      : "Lično preuzimanje"}
                  </p>
                </div>
              </div>

              <table className="table table-bordered border-dark text-center align-middle mb-5">
                <thead className="table-light">
                  <tr>
                    <th className="py-3">R.B.</th>
                    <th className="py-3">Dimenzije (Š x V)</th>
                    <th className="py-3">Tip / Šablon</th>
                    <th className="py-3">Smer</th>
                    <th className="py-3">Komada</th>
                    <th className="py-3">Napomena</th>
                  </tr>
                </thead>
                <tbody className="fs-5">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="fw-bold">{idx + 1}.</td>
                        <td>
                          <strong>
                            {item.widthW} x {item.heightH}
                          </strong>
                        </td>
                        <td>
                          {item.productTemplate?.name || "Standard"}
                          {item.type === "SERVICE" && " (SERVIS)"}
                        </td>
                        <td>
                          {item.openingDirection === "LEFT" ? "Levo" : "Desno"}
                        </td>
                        <td>
                          <strong>{item.quantity}</strong>
                        </td>
                        <td className="fst-italic">{item.note || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-muted py-4">
                        Nema stavki.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="row mt-5 pt-5">
                <div className="col-6 text-center">
                  <div
                    className="border-top border-dark border-2 d-inline-block pt-2 fw-bold"
                    style={{ width: "250px" }}
                  >
                    Potpis: Izdao robu
                  </div>
                </div>
                <div className="col-6 text-center">
                  <div
                    className="border-top border-dark border-2 d-inline-block pt-2 fw-bold"
                    style={{ width: "250px" }}
                  >
                    Potpis: Primio robu
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DashboardLayout;
