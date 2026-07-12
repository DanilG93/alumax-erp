import { useState, useEffect } from "react";
import { createWorkOrder, getCustomerSuggestions } from "../api/api";

function AdminLayout() {
  // 1. Podaci o kupcu (Glava naloga)
  const [orderHeader, setOrderHeader] = useState({
    protocolNumber: "",
    customerDescription: "",
    orderType: "NEW_ORDER",
    deliveryRequired: false,
    deliveryAddress: "",
  });

  // 2. Podaci za trenutni komarnik koji se unosi
  const initialItemState = {
    inputWidth: "",
    inputHeight: "",
    plisseType: "VRSTA_1",
    isDouble: false,
    hasThreshold: false,
    openingDirection: "RIGHT",
  };
  const [currentItem, setCurrentItem] = useState(initialItemState);

  // 3. Niz svih dodatih komarnika u ovaj nalog
  const [items, setItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

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

  // Funkcija za dodavanje komarnika u listu
  const handleAddItem = () => {
    if (!currentItem.inputWidth || !currentItem.inputHeight) {
      alert("Molimo vas unesite širinu i visinu komarnika!");
      return;
    }
    setItems([...items, currentItem]);
    setCurrentItem(initialItemState); // Resetuj formu za sledeći komarnik
  };

  // Funkcija za brisanje komarnika iz liste pre čuvanja
  const handleRemoveItem = (indexToRemove) => {
    setItems(items.filter((_, index) => index !== indexToRemove));
  };

  // Slanje kompletnog naloga na backend
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Nalog mora imati bar jedan komarnik!");
      return;
    }

    // Pakovanje podataka tačno kako Backend (WorkOrder entitet) očekuje
    const payload = {
      ...orderHeader,
      items: items,
    };

    try {
      await createWorkOrder(payload);
      alert("Kompletan nalog uspešno kreiran!");

      // Resetuj sve nakon uspešnog čuvanja
      setOrderHeader({
        protocolNumber: "",
        customerDescription: "",
        orderType: "NEW_ORDER",
        deliveryRequired: false,
        deliveryAddress: "",
      });
      setItems([]);
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
      {/* BOČNI MENI */}
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

      {/* GLAVNI SADRŽAJ */}
      <div className="flex-grow-1 p-4 p-md-5 overflow-auto">
        <h2 className="mb-4 fw-bold text-dark">
          Kreiranje Novog Radnog Naloga
        </h2>

        {/* =========================================
            SEKCIJA 1: IDENTIFIKACIJA KUPCA
        ========================================= */}
        <div className="card p-4 shadow-sm border-0 mb-4 rounded-4">
          <h5 className="text-muted fw-bold mb-3">
            1. IDENTIFIKACIJA I ISPORUKA
          </h5>
          <div className="row g-3 align-items-center">
            <div className="col-md-5">
              <label className="form-label fw-medium">Kupac / Opis</label>
              <input
                type="text"
                className="form-control form-control-lg"
                list="customer-suggestions"
                placeholder="Kreni da kucaš..."
                value={orderHeader.customerDescription}
                onChange={(e) =>
                  setOrderHeader({
                    ...orderHeader,
                    customerDescription: e.target.value,
                  })
                }
              />
              <datalist id="customer-suggestions">
                {suggestions.map((sug, index) => (
                  <option key={index} value={sug} />
                ))}
              </datalist>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-medium">Broj Protokola</label>
              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="Automatski (+1)"
                value={orderHeader.protocolNumber}
                onChange={(e) =>
                  setOrderHeader({
                    ...orderHeader,
                    protocolNumber: e.target.value,
                  })
                }
              />
            </div>
            <div className="col-md-4 mt-4">
              <div className="form-check form-switch fs-5 ms-md-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="deliverySwitch"
                  checked={orderHeader.deliveryRequired}
                  onChange={(e) =>
                    setOrderHeader({
                      ...orderHeader,
                      deliveryRequired: e.target.checked,
                    })
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
            {orderHeader.deliveryRequired && (
              <div className="col-12 mt-3">
                <label className="form-label fw-medium text-primary">
                  Unesite adresu za isporuku
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg border-primary"
                  placeholder="Karađorđeva 15..."
                  value={orderHeader.deliveryAddress}
                  onChange={(e) =>
                    setOrderHeader({
                      ...orderHeader,
                      deliveryAddress: e.target.value,
                    })
                  }
                />
              </div>
            )}
          </div>
        </div>

        {/* =========================================
            SEKCIJA 2: DODAVANJE KOMARNIKA (STAVKE)
        ========================================= */}
        <div
          className="card p-4 shadow-sm border-primary border mb-4 rounded-4"
          style={{ backgroundColor: "#f8fbff" }}
        >
          <h5 className="text-primary fw-bold mb-3">
            2. KONFIGURACIJA KOMARNIKA
          </h5>

          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <label className="form-label fw-bold">Širina (mm)</label>
              <input
                type="number"
                className="form-control form-control-lg"
                placeholder="Širina"
                value={currentItem.inputWidth}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, inputWidth: e.target.value })
                }
              />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-bold">Visina (mm)</label>
              <input
                type="number"
                className="form-control form-control-lg"
                placeholder="Visina"
                value={currentItem.inputHeight}
                onChange={(e) =>
                  setCurrentItem({
                    ...currentItem,
                    inputHeight: e.target.value,
                  })
                }
              />
            </div>
            <div className="col-md-6 d-flex align-items-end">
              <div className="w-100 d-flex gap-2">
                <button
                  className={`btn flex-fill fw-bold ${currentItem.plisseType === "VRSTA_1" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() =>
                    setCurrentItem({ ...currentItem, plisseType: "VRSTA_1" })
                  }
                >
                  Vrsta 1
                </button>
                <button
                  className={`btn flex-fill fw-bold ${currentItem.plisseType === "VRSTA_2" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() =>
                    setCurrentItem({ ...currentItem, plisseType: "VRSTA_2" })
                  }
                >
                  Vrsta 2
                </button>
              </div>
            </div>
          </div>

          <div className="row g-4 align-items-center mb-4">
            <div className="col-md-6 border-end">
              <div className="form-check mb-2 fs-5">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="isDoubleCheck"
                  checked={currentItem.isDouble}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setCurrentItem({
                      ...currentItem,
                      isDouble: isChecked,
                      openingDirection: isChecked ? "CENTER" : "RIGHT",
                    });
                  }}
                />
                <label className="form-check-label" htmlFor="isDoubleCheck">
                  Dvodelni Komarnik
                </label>
              </div>
              <div className="form-check fs-5">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="hasThresholdCheck"
                  checked={currentItem.hasThreshold}
                  onChange={(e) =>
                    setCurrentItem({
                      ...currentItem,
                      hasThreshold: e.target.checked,
                    })
                  }
                />
                <label className="form-check-label" htmlFor="hasThresholdCheck">
                  Sa pragom
                </label>
              </div>
            </div>

            <div className="col-md-6">
              <p className="fw-medium mb-2">Smer Otvaranja</p>
              {currentItem.isDouble ? (
                <button
                  className="btn btn-secondary w-100 fw-bold fs-5"
                  disabled
                >
                  &larr; SREDINA &rarr;
                </button>
              ) : (
                <div className="d-flex gap-2">
                  <button
                    className={`btn flex-fill fw-bold fs-4 ${currentItem.openingDirection === "LEFT" ? "btn-dark" : "btn-outline-dark"}`}
                    onClick={() =>
                      setCurrentItem({
                        ...currentItem,
                        openingDirection: "LEFT",
                      })
                    }
                  >
                    &larr; Levo
                  </button>
                  <button
                    className={`btn flex-fill fw-bold fs-4 ${currentItem.openingDirection === "RIGHT" ? "btn-dark" : "btn-outline-dark"}`}
                    onClick={() =>
                      setCurrentItem({
                        ...currentItem,
                        openingDirection: "RIGHT",
                      })
                    }
                  >
                    Desno &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline-primary btn-lg w-100 fw-bold"
            onClick={handleAddItem}
          >
            ➕ DODAJ KOMARNIK U NALOG
          </button>
        </div>

        {/* =========================================
            SEKCIJA 3: KORPA (LISTA STAVKI) I SLANJE
        ========================================= */}
        {items.length > 0 && (
          <div className="card p-4 shadow-sm border-0 mb-4 rounded-4 animate__animated animate__fadeIn">
            <h5 className="text-success fw-bold mb-3">
              3. DODATI KOMARNICI ({items.length})
            </h5>
            <div className="table-responsive mb-4">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Dimenzije (ŠxV)</th>
                    <th>Vrsta</th>
                    <th>Struktura</th>
                    <th>Smer</th>
                    <th>Ukloni</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold">{idx + 1}</td>
                      <td className="fs-5">
                        {item.inputWidth} x {item.inputHeight} mm
                      </td>
                      <td>
                        {item.plisseType === "VRSTA_1" ? "Vrsta 1" : "Vrsta 2"}
                      </td>
                      <td>
                        {item.isDouble ? "Dvodelni" : "Jednodelni"}
                        <br />
                        <small className="text-muted">
                          {item.hasThreshold ? "Sa pragom" : ""}
                        </small>
                      </td>
                      <td>
                        {item.openingDirection === "CENTER"
                          ? "Sredina"
                          : item.openingDirection === "LEFT"
                            ? "Levo"
                            : "Desno"}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemoveItem(idx)}
                        >
                          ✖
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              className="btn btn-success btn-lg w-100 fw-bold fs-4 shadow"
              onClick={handleSubmitOrder}
            >
              💾 SAČUVAJ KOMPLETAN NALOG
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminLayout;
