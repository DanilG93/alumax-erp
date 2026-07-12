import { useState, useEffect } from "react";
import { createWorkOrder, getCustomerSuggestions } from "../api/api";

function AdminLayout() {
  const [order, setOrder] = useState({
    protocolNumber: "",
    customerDescription: "",
    inputWidth: "",
    inputHeight: "",
    orderType: "NEW_ORDER",
    deliveryRequired: false,
    deliveryAddress: "",
    plisseType: "VRSTA_1",
    isDouble: false,
    noThreshold: false,
    openingDirection: "RIGHT",
  });

  const [suggestions, setSuggestions] = useState([]);

  // Učitavanje starih kupaca čim se stranica otvori
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await getCustomerSuggestions();
        setSuggestions(response.data);
      } catch (error) {
        console.error("Greška pri učitavanju predloga kupaca:", error);
      }
    };
    fetchSuggestions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createWorkOrder(order);
      alert("Nalog uspešno kreiran!");
      // Reset forme nakon uspesnog slanja
      setOrder({
        protocolNumber: "",
        customerDescription: "",
        inputWidth: "",
        inputHeight: "",
        orderType: "NEW_ORDER",
        deliveryRequired: false,
        deliveryAddress: "",
        plisseType: "VRSTA_1",
        isDouble: false,
        noThreshold: false,
        openingDirection: "RIGHT",
      });
    } catch (error) {
      console.error("Greška pri kreiranju naloga:", error);
      alert("Greška pri kreiranju naloga.");
    }
  };

  return (
    <div
      className="d-flex"
      style={{ minHeight: "100vh", backgroundColor: "#f4f6f9" }}
    >
      {/* BOČNI MENI (SIDEBAR) */}
      <div
        className="bg-dark text-white p-3 shadow-lg"
        style={{ width: "260px" }}
      >
        <h3 className="mb-4 text-center fw-bold mt-2">Alumax ERP</h3>
        <hr />
        <ul className="nav nav-pills flex-column mb-auto gap-2">
          <li className="nav-item">
            <a href="#" className="nav-link active fw-bold fs-5">
              📝 Nova Narudžbina
            </a>
          </li>
          <li>
            <a href="#" className="nav-link text-white fs-5 opacity-75">
              📋 Lista Naloga
            </a>
          </li>
          <li>
            <a href="#" className="nav-link text-white fs-5 opacity-75">
              ⚙️ Podešavanja
            </a>
          </li>
          <li>
            <a href="#" className="nav-link text-white fs-5 opacity-75">
              🚚 Logistika
            </a>
          </li>
        </ul>
      </div>

      {/* GLAVNI SADRŽAJ (FORMA) */}
      <div className="flex-grow-1 p-4 p-md-5 overflow-auto">
        <h2 className="mb-4 fw-bold text-dark">
          Kreiranje Novog Radnog Naloga
        </h2>

        <form onSubmit={handleSubmit}>
          {/* SEKCIJA 1: IDENTIFIKACIJA I ISPORUKA */}
          <div className="card p-4 shadow-sm border-0 mb-4 rounded-4">
            <h5 className="text-muted fw-bold mb-3">
              IDENTIFIKACIJA I ISPORUKA
            </h5>
            <div className="row g-3 align-items-center">
              <div className="col-md-5">
                <label className="form-label fw-medium">
                  1. Kupac / Opis (Autocomplete)
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  list="customer-suggestions"
                  placeholder="Kreni da kucaš..."
                  value={order.customerDescription}
                  onChange={(e) =>
                    setOrder({ ...order, customerDescription: e.target.value })
                  }
                  required
                />
                <datalist id="customer-suggestions">
                  {suggestions.map((sug, index) => (
                    <option key={index} value={sug} />
                  ))}
                </datalist>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-medium">
                  2. Broj Protokola
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Automatski (+1)"
                  value={order.protocolNumber}
                  onChange={(e) =>
                    setOrder({ ...order, protocolNumber: e.target.value })
                  }
                />
              </div>

              <div className="col-md-4 d-flex flex-column align-items-start mt-4">
                <div className="form-check form-switch fs-5 ms-md-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="deliverySwitch"
                    checked={order.deliveryRequired}
                    onChange={(e) =>
                      setOrder({ ...order, deliveryRequired: e.target.checked })
                    }
                  />
                  <label
                    className="form-check-label fw-bold"
                    htmlFor="deliverySwitch"
                  >
                    🚚 Potrebna Isporuka
                  </label>
                </div>
              </div>

              {/* POLJE ZA ADRESU KOJE SE POJAVLJUJE AKO JE ISPORUKA ŠTIKLIRANA */}
              {order.deliveryRequired && (
                <div className="col-12 mt-3 animate__animated animate__fadeIn">
                  <label className="form-label fw-medium text-primary">
                    Unesite adresu za isporuku
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg border-primary"
                    placeholder="Npr. Karađorđeva 15..."
                    value={order.deliveryAddress}
                    onChange={(e) =>
                      setOrder({ ...order, deliveryAddress: e.target.value })
                    }
                    required={order.deliveryRequired}
                  />
                </div>
              )}
            </div>
          </div>

          {/* SEKCIJA 2: DIMENZIJE */}
          <div className="card p-4 shadow-sm border-0 mb-4 rounded-4">
            <h5 className="text-muted fw-bold mb-3">DIMENZIJE (mm)</h5>
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label fw-bold fs-5">Širina (Š)</label>
                <input
                  type="number"
                  className="form-control form-control-lg bg-light"
                  placeholder="Npr. 1200"
                  value={order.inputWidth}
                  onChange={(e) =>
                    setOrder({ ...order, inputWidth: Number(e.target.value) })
                  }
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold fs-5">Visina (V)</label>
                <input
                  type="number"
                  className="form-control form-control-lg bg-light"
                  placeholder="Npr. 1400"
                  value={order.inputHeight}
                  onChange={(e) =>
                    setOrder({ ...order, inputHeight: Number(e.target.value) })
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* SEKCIJA 3: KONFIGURACIJA PLISEA */}
          <div className="card p-4 shadow-sm border-0 mb-4 rounded-4">
            <h5 className="text-muted fw-bold mb-4">KONFIGURACIJA PLISEA</h5>
            <div className="row g-4 align-items-center">
              {/* VRSTA */}
              <div className="col-md-4 border-end">
                <p className="fw-medium mb-2">1. Vrsta Plisea</p>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className={`btn btn-lg flex-fill fw-bold ${order.plisseType === "VRSTA_1" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() =>
                      setOrder({ ...order, plisseType: "VRSTA_1" })
                    }
                  >
                    Vrsta 1
                  </button>
                  <button
                    type="button"
                    className={`btn btn-lg flex-fill fw-bold ${order.plisseType === "VRSTA_2" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() =>
                      setOrder({ ...order, plisseType: "VRSTA_2" })
                    }
                  >
                    Vrsta 2
                  </button>
                </div>
              </div>

              {/* OPCIJE */}
              <div className="col-md-4 border-end px-md-4">
                <p className="fw-medium mb-2">2. Opcije</p>
                <div className="form-check mb-2 fs-5">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="isDoubleCheck"
                    checked={order.isDouble}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setOrder({
                        ...order,
                        isDouble: isChecked,
                        openingDirection: isChecked ? "CENTER" : "RIGHT",
                      });
                    }}
                  />
                  <label className="form-check-label" htmlFor="isDoubleCheck">
                    Dupli Komarnik
                  </label>
                </div>
                <div className="form-check fs-5">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="noThresholdCheck"
                    checked={order.noThreshold}
                    onChange={(e) =>
                      setOrder({ ...order, noThreshold: e.target.checked })
                    }
                  />
                  <label
                    className="form-check-label"
                    htmlFor="noThresholdCheck"
                  >
                    Bez Praga (Gusenica)
                  </label>
                </div>
              </div>

              {/* SMER OTVARANJA */}
              <div className="col-md-4 px-md-4">
                <p className="fw-medium mb-2">3. Smer Otvaranja</p>
                {order.isDouble ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-lg w-100 fw-bold fs-3"
                    disabled
                  >
                    &larr; SREDINA &rarr;
                  </button>
                ) : (
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className={`btn btn-lg flex-fill fw-bold fs-3 ${order.openingDirection === "LEFT" ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() =>
                        setOrder({ ...order, openingDirection: "LEFT" })
                      }
                    >
                      &larr;
                    </button>
                    <button
                      type="button"
                      className={`btn btn-lg flex-fill fw-bold fs-3 ${order.openingDirection === "RIGHT" ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() =>
                        setOrder({ ...order, openingDirection: "RIGHT" })
                      }
                    >
                      &rarr;
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-success mt-2 btn-lg w-100 fw-bold fs-4 shadow"
          >
            💾 SAČUVAJ NALOG
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLayout;
