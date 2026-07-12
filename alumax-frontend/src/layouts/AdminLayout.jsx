import { useState } from "react";
import { createWorkOrder } from "../api/api";

function AdminLayout() {
  const [order, setOrder] = useState({
    customerDescription: "",
    inputWidth: "",
    inputHeight: "",
    orderType: "NEW_ORDER",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createWorkOrder(order);
      alert("Nalog uspešno kreiran!");
      setOrder({
        customerDescription: "",
        inputWidth: "",
        inputHeight: "",
        orderType: "NEW_ORDER",
      });
    } catch (error) {
      console.error("Greška pri kreiranju naloga:", error);
      alert("Greška pri kreiranju naloga.");
    }
  };

  return (
    <div className="container p-4">
      <h2 className="mb-4">📋 Kreiranje novog radnog naloga</h2>
      <form onSubmit={handleSubmit} className="card p-4 shadow-sm border-0">
        <div className="mb-3">
          <label className="form-label">Kupac / Opis</label>
          <input
            type="text"
            className="form-control"
            value={order.customerDescription}
            onChange={(e) =>
              setOrder({ ...order, customerDescription: e.target.value })
            }
            required
          />
        </div>
        <div className="row">
          <div className="col">
            <label className="form-label">Širina (mm)</label>
            <input
              type="number"
              className="form-control"
              value={order.inputWidth}
              onChange={(e) =>
                setOrder({ ...order, inputWidth: Number(e.target.value) })
              }
              required
            />
          </div>
          <div className="col">
            <label className="form-label">Visina (mm)</label>
            <input
              type="number"
              className="form-control"
              value={order.inputHeight}
              onChange={(e) =>
                setOrder({ ...order, inputHeight: Number(e.target.value) })
              }
              required
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary mt-4 btn-lg w-100">
          SAČUVAJ NALOG
        </button>
      </form>
    </div>
  );
}

export default AdminLayout;
