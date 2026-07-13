import { useState, useEffect } from "react";
import { getAllOrderItems, updateOrderItemStatus } from "../api/api";

function KioskLayout() {
  const [items, setItems] = useState([]);

  // Funkcija za povlačenje podataka sa servera
  const fetchItems = async () => {
    try {
      const response = await getAllOrderItems();

      const data = Array.isArray(response.data) ? response.data : [];
      setItems(data);
    } catch (error) {
      console.error("Greška pri povlačenju stavki za Kiosk:", error);
    }
  };

  useEffect(() => {
    fetchItems();
    // Opciono: Automatsko osvežavanje svakih 30 sekundi da bi majstori videli nove naloge
    const interval = setInterval(() => fetchItems(), 30000);
    return () => clearInterval(interval);
  }, []);

  // Funkcija kada majstor klikne na dugme za promenu statusa
  const handleStatusChange = async (itemId, newStatus) => {
    try {
      await updateOrderItemStatus(itemId, newStatus);
      // Odmah osveži tablu nakon promene
      fetchItems();
    } catch (error) {
      console.error("Greška pri promeni statusa:", error);
      alert("Došlo je do greške pri promeni statusa.");
    }
  };

  // Filtriranje komarnika po kolonama
  const newItems = items.filter((item) => item.status === "NEW");
  const inProgressItems = items.filter((item) => item.status === "IN_PROGRESS");
  const completedItems = items.filter((item) => item.status === "COMPLETED");

  // Komponenta za karticu komarnika (da ne ponavljamo kod)
  const ItemCard = ({ item, type }) => (
    <div
      className={`card mb-3 shadow-sm border-0 ${type === "NEW" ? "border-start border-primary border-5" : type === "IN_PROGRESS" ? "border-start border-warning border-5" : "border-start border-success border-5"}`}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="badge bg-dark fs-6">
            Nalog #{item.workOrder?.protocolNumber || "N/A"}
          </span>
          <span className="text-muted small">ID: {item.id}</span>
        </div>

        <h3 className="card-title fw-bold text-center mt-3 mb-1">
          {item.inputWidth} x {item.inputHeight}
        </h3>
        <p className="text-center text-muted fw-bold mb-3">
          {item.plisseType === "VRSTA_1" ? "Vrsta 1" : "Vrsta 2"}
        </p>

        <div className="d-flex justify-content-between text-center bg-light p-2 rounded mb-3">
          <div className="w-50 border-end">
            <span className="d-block fw-bold">
              {item.isDouble ? "Dvodelni" : "Jednodelni"}
            </span>
          </div>
          <div className="w-50">
            <span className="d-block fw-bold text-success">
              {item.hasThreshold ? "Sa pragom" : "Bez praga"}
            </span>
          </div>
        </div>

        {!item.isDouble && (
          <p className="text-center fw-bold text-dark fs-5 mb-3">
            Smer:{" "}
            {item.openingDirection === "LEFT" ? "Levo \u2190" : "Desno \u2192"}
          </p>
        )}

        <div className="mt-auto pt-2">
          {type === "NEW" && (
            <button
              className="btn btn-primary w-100 fw-bold py-2 fs-5"
              onClick={() => handleStatusChange(item.id, "IN_PROGRESS")}
            >
              🚀 KRENI U RAD
            </button>
          )}
          {type === "IN_PROGRESS" && (
            <button
              className="btn btn-success w-100 fw-bold py-2 fs-5"
              onClick={() => handleStatusChange(item.id, "COMPLETED")}
            >
              ✅ ZAVRŠENO
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="container-fluid pt-4 pb-4"
      style={{ backgroundColor: "#e9ecef", minHeight: "100vh" }}
    >
      {/* HEADER KIOSKA */}
      <div className="d-flex justify-content-between align-items-center mb-4 bg-dark text-white p-3 rounded shadow">
        <h2 className="m-0 fw-bold">🛠️ ALUMAX KIOSK: Radionica</h2>
        <button className="btn btn-outline-light fw-bold" onClick={fetchItems}>
          🔄 Osveži
        </button>
      </div>

      {/* KANBAN TABLA */}
      <div className="row g-4 h-100">
        {/* KOLONA 1: NOVI NALOZI */}
        <div className="col-md-4">
          <div className="bg-white rounded-top p-3 border-bottom border-primary border-4 shadow-sm">
            <h4 className="text-primary fw-bold text-center m-0">
              NOVI NALOZI ({newItems.length})
            </h4>
          </div>
          <div
            className="p-3"
            style={{ height: "calc(100vh - 180px)", overflowY: "auto" }}
          >
            {newItems.map((item) => (
              <ItemCard key={item.id} item={item} type="NEW" />
            ))}
            {newItems.length === 0 && (
              <p className="text-center text-muted mt-5">Nema novih naloga.</p>
            )}
          </div>
        </div>

        {/* KOLONA 2: U RADU */}
        <div className="col-md-4">
          <div className="bg-white rounded-top p-3 border-bottom border-warning border-4 shadow-sm">
            <h4
              className="text-warning fw-bold text-center m-0"
              style={{ color: "#d39e00" }}
            >
              U RADU ({inProgressItems.length})
            </h4>
          </div>
          <div
            className="p-3 bg-light"
            style={{ height: "calc(100vh - 180px)", overflowY: "auto" }}
          >
            {inProgressItems.map((item) => (
              <ItemCard key={item.id} item={item} type="IN_PROGRESS" />
            ))}
            {inProgressItems.length === 0 && (
              <p className="text-center text-muted mt-5">Nema stavki u radu.</p>
            )}
          </div>
        </div>

        {/* KOLONA 3: ZAVRŠENO */}
        <div className="col-md-4">
          <div className="bg-white rounded-top p-3 border-bottom border-success border-4 shadow-sm">
            <h4 className="text-success fw-bold text-center m-0">
              ZAVRŠENO ({completedItems.length})
            </h4>
          </div>
          <div
            className="p-3"
            style={{
              height: "calc(100vh - 180px)",
              overflowY: "auto",
              opacity: "0.8",
            }}
          >
            {completedItems.map((item) => (
              <ItemCard key={item.id} item={item} type="COMPLETED" />
            ))}
            {completedItems.length === 0 && (
              <p className="text-center text-muted mt-5">
                Nema završenih naloga.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default KioskLayout;
