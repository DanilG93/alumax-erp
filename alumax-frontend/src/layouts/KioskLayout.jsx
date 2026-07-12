import { useState, useEffect } from "react";
import { getWorkOrders, updateWorkOrderStatus } from "../api/api";

function KioskLayout() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Učitavanje naloga kada se komponenta prikaže
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await getWorkOrders();
      setOrders(response.data);
    } catch (error) {
      console.error("Greška pri učitavanju naloga:", error);
      alert("Ne mogu da učitam naloge. Da li je backend pokrenut?");
    } finally {
      setLoading(false);
    }
  };

  // Funkcija za promenu statusa
  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateWorkOrderStatus(id, newStatus);
      // Osvježi listu nakon promene
      fetchOrders();
    } catch (error) {
      console.error("Greška pri ažuriranju statusa:", error);
      alert("Greška pri ažuriranju statusa!");
    }
  };

  // Prevodi status na srpski za prikaz
  const translateStatus = (status) => {
    const map = {
      NEW: "NOVO",
      IN_PROGRESS: "U RADU",
      READY_FOR_ASSEMBLY: "ZA SKLAPANJE",
      COMPLETED: "ZAVRŠENO",
    };
    return map[status] || status;
  };

  // Boje za status (Bootstrap klase)
  const getStatusColor = (status) => {
    const map = {
      NEW: "secondary",
      IN_PROGRESS: "primary",
      READY_FOR_ASSEMBLY: "warning",
      COMPLETED: "success",
    };
    return map[status] || "secondary";
  };

  // Renderovanje dugmadi u zavisnosti od statusa
  const renderActions = (order) => {
    if (order.status === "COMPLETED") {
      return (
        <span className="badge bg-success fs-2 p-3 w-100">✅ ZAVRŠENO</span>
      );
    }

    return (
      <div className="d-flex flex-column gap-2 w-100">
        {order.status === "NEW" && (
          <button
            className="btn btn-primary btn-lg py-3 fs-3"
            onClick={() => handleStatusChange(order.id, "IN_PROGRESS")}
          >
            🚀 KRENI U RAD
          </button>
        )}

        {(order.status === "IN_PROGRESS" || order.status === "NEW") && (
          <button
            className="btn btn-warning btn-lg py-3 fs-3"
            onClick={() => handleStatusChange(order.id, "READY_FOR_ASSEMBLY")}
          >
            🧵 ZAVRŠENA MREŽICA
          </button>
        )}

        {order.status !== "COMPLETED" && (
          <button
            className="btn btn-success btn-lg py-3 fs-3"
            onClick={() => handleStatusChange(order.id, "COMPLETED")}
          >
            ✅ ZAVRŠENO KOMPLETNO
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
        <h1 className="display-1 pt-5">⏳ Učitavanje...</h1>
      </div>
    );
  }

  return (
    <div
      className="container-fluid bg-light p-4"
      style={{ minHeight: "100vh" }}
    >
      <h1 className="display-2 text-center mb-4">🏭 RADNI NALOZI</h1>

      {orders.length === 0 ? (
        <div className="text-center mt-5">
          <h2 className="display-4">📭 Nema aktivnih naloga</h2>
        </div>
      ) : (
        <div className="row g-4">
          {orders.map((order) => (
            <div key={order.id} className="col-12 col-md-6 col-xl-4">
              <div className="card h-100 shadow-lg p-3 border-0">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title display-6">
                    {order.customerDescription || "Nepoznat kupac"}
                  </h5>

                  <div className="fs-3 my-2">
                    <span className="badge bg-secondary me-2">
                      📏 {order.inputWidth}mm
                    </span>
                    <span className="badge bg-secondary">
                      📐 {order.inputHeight}mm
                    </span>
                  </div>

                  <p className="fs-4 mt-2">
                    Status:
                    <span
                      className={`badge bg-${getStatusColor(order.status)} fs-3 ms-2 p-2`}
                    >
                      {translateStatus(order.status)}
                    </span>
                  </p>

                  <hr className="my-3" />

                  <div className="mt-auto">{renderActions(order)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default KioskLayout;
