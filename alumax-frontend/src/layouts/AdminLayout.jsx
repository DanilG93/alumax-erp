import { useState, useEffect } from "react";
import {
  createWorkOrder,
  getCustomerSuggestions,
  getTemplates,
} from "../api/api";

function AdminLayout() {
  const [orderHeader, setOrderHeader] = useState({
    customerName: "",
    protocolNumber: "",
    profileColor: "Bela", // <-- Default boja profila
    deliveryDate: "",
    isUrgent: false,
    requiresDelivery: false,
    deliveryAddress: "",
  });

  const initialItemState = {
    type: "NEW_ORDER",
    productTemplateId: "",
    widthW: "",
    heightH: "",
    quantity: 1,
    openingDirection: "LEFT", // <-- Default smer otvaranja
    note: "",
  };

  const [currentItem, setCurrentItem] = useState(initialItemState);
  const [items, setItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    fetchSuggestions();
    fetchTemplates();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await getCustomerSuggestions();
      setSuggestions(response.data);
    } catch (error) {
      console.error("Greška pri učitavanju predloga kupaca:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await getTemplates();
      setTemplates(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Greška pri učitavanju šablona:", error);
    }
  };

  const getDayOfWeek = (dateString) => {
    if (!dateString) return "";
    const days = [
      "Nedelja",
      "Ponedeljak",
      "Utorak",
      "Sreda",
      "Četvrtak",
      "Petak",
      "Subota",
    ];
    const d = new Date(dateString);
    return days[d.getDay()];
  };

  const handleAddItem = () => {
    if (!currentItem.widthW || !currentItem.heightH) {
      alert("Molimo vas unesite širinu i visinu!");
      return;
    }
    if (currentItem.type === "NEW_ORDER" && !currentItem.productTemplateId) {
      alert("Molimo izaberite vrstu proizvoda (Šablon)!");
      return;
    }

    const itemToSave = {
      type: currentItem.type,
      widthW: parseFloat(currentItem.widthW),
      heightH: parseFloat(currentItem.heightH),
      quantity: parseInt(currentItem.quantity, 10),
      openingDirection: currentItem.openingDirection,
      note: currentItem.note,
    };

    if (currentItem.productTemplateId) {
      itemToSave.productTemplate = { id: currentItem.productTemplateId };
    }

    setItems([...items, itemToSave]);
    // Resetujemo unos, ali čuvamo izabrani tip i default smer
    setCurrentItem({ ...initialItemState, type: currentItem.type });
  };

  const handleRemoveItem = (indexToRemove) => {
    setItems(items.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Nalog mora imati bar jednu stavku!");
      return;
    }
    if (!orderHeader.customerName) {
      alert("Unesite ime naručioca!");
      return;
    }

    const payload = { ...orderHeader, items: items };

    try {
      await createWorkOrder(payload);
      alert("Nalog je uspešno poslat u radionicu!");
      // Reset celog ekrana, vraćamo default boju na Belu
      setOrderHeader({
        customerName: "",
        protocolNumber: "",
        profileColor: "Bela",
        deliveryDate: "",
        isUrgent: false,
        requiresDelivery: false,
        deliveryAddress: "",
      });
      setItems([]);
    } catch (error) {
      console.error("Greška pri kreiranju naloga:", error);
      alert("Došlo je do greške pri snimanju naloga.");
    }
  };

  const selectedTemplateName = (templateId) => {
    const t = templates.find((t) => t.id === parseInt(templateId));
    return t ? t.name : "Nije izabrano";
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
          <li>
            <a href="/kiosk" className="nav-link text-white fs-5">
              Kiosk
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className="nav-link active fw-bold fs-5">
              Nova Narudžbina
            </a>
          </li>
          <li>
            <a href="/settings" className="nav-link text-white fs-5">
              Podešavanja
            </a>
          </li>
        </ul>
      </div>

      {/* GLAVNI SADRŽAJ */}
      <div className="flex-grow-1 p-4 p-md-5 overflow-auto">
        {/* SEKCIJA 1: IDENTIFIKACIJA KUPCA I ROKOVI */}
        <div
          className={`card p-4 shadow-sm border-0 mb-4 rounded-4 ${orderHeader.isUrgent ? "border border-danger border-3 bg-danger bg-opacity-10" : "bg-white"}`}
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="text-muted fw-bold mb-0">1. GLAVNI PODACI NALOGA</h5>
            <div className="form-check form-switch fs-4 d-flex align-items-center">
              <input
                className={`form-check-input mt-0 ${orderHeader.isUrgent ? "bg-danger border-danger" : ""}`}
                type="checkbox"
                role="switch"
                id="urgentSwitch"
                checked={orderHeader.isUrgent}
                onChange={(e) =>
                  setOrderHeader({ ...orderHeader, isUrgent: e.target.checked })
                }
                style={{ cursor: "pointer" }}
              />
              <label
                className="form-check-label fw-bold text-danger ms-2"
                htmlFor="urgentSwitch"
                style={{ cursor: "pointer" }}
              >
                HITNO
              </label>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-medium text-dark">
                Kupac / Naručilac
              </label>
              <input
                type="text"
                className="form-control form-control-lg"
                list="customer-suggestions"
                placeholder="Ime i prezime ili firma"
                value={orderHeader.customerName}
                onChange={(e) =>
                  setOrderHeader({
                    ...orderHeader,
                    customerName: e.target.value,
                  })
                }
              />
              <datalist id="customer-suggestions">
                {suggestions.map((sug, index) => (
                  <option key={index} value={sug} />
                ))}
              </datalist>
            </div>

            <div className="col-md-2">
              <label className="form-label fw-medium text-dark">
                Broj Protokola
              </label>
              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="Automatski"
                value={orderHeader.protocolNumber}
                onChange={(e) =>
                  setOrderHeader({
                    ...orderHeader,
                    protocolNumber: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-medium text-dark">
                Boja Profila
              </label>
              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="Npr. Bela, Antracit..."
                value={orderHeader.profileColor}
                onChange={(e) =>
                  setOrderHeader({
                    ...orderHeader,
                    profileColor: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-medium text-dark">
                Datum završetka
                {orderHeader.deliveryDate && (
                  <span className="ms-2 text-primary fw-bold">
                    ({getDayOfWeek(orderHeader.deliveryDate)})
                  </span>
                )}
              </label>
              <input
                type="date"
                className="form-control form-control-lg fw-bold text-primary"
                value={orderHeader.deliveryDate}
                onChange={(e) =>
                  setOrderHeader({
                    ...orderHeader,
                    deliveryDate: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-12 mt-3 pt-3 border-top">
              <div className="form-check form-switch fs-5 mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="deliverySwitch"
                  checked={orderHeader.requiresDelivery}
                  onChange={(e) =>
                    setOrderHeader({
                      ...orderHeader,
                      requiresDelivery: e.target.checked,
                    })
                  }
                  style={{ cursor: "pointer" }}
                />
                <label
                  className="form-check-label fw-bold text-dark ms-2"
                  htmlFor="deliverySwitch"
                  style={{ cursor: "pointer" }}
                >
                  Potrebna Isporuka
                </label>
              </div>
              {orderHeader.requiresDelivery && (
                <input
                  type="text"
                  className="form-control form-control-lg border-primary"
                  placeholder="Unesite tačnu adresu za isporuku..."
                  value={orderHeader.deliveryAddress}
                  onChange={(e) =>
                    setOrderHeader({
                      ...orderHeader,
                      deliveryAddress: e.target.value,
                    })
                  }
                />
              )}
            </div>
          </div>
        </div>

        {/* SEKCIJA 2: KONFIGURACIJA STAVKE */}
        <div className="card p-4 shadow-sm border-primary border-top border-4 mb-4 rounded-4 bg-white">
          <h5 className="text-primary fw-bold mb-4">2. KONFIGURACIJA STAVKE</h5>

          {/* VELIKI PREKIDAČ ZA TIP POSLA */}
          <div className="d-flex w-100 mb-4 bg-light p-1 rounded-pill border">
            <button
              className={`btn rounded-pill flex-fill fs-5 fw-bold py-2 ${currentItem.type === "NEW_ORDER" ? "btn-primary shadow" : "btn-light text-muted"}`}
              onClick={() =>
                setCurrentItem({ ...currentItem, type: "NEW_ORDER" })
              }
            >
              NOVA IZRADA
            </button>
            <button
              className={`btn rounded-pill flex-fill fs-5 fw-bold py-2 ${currentItem.type === "SERVICE" ? "btn-warning text-dark shadow" : "btn-light text-muted"}`}
              onClick={() =>
                setCurrentItem({ ...currentItem, type: "SERVICE" })
              }
            >
              SERVIS / POPRAVKA
            </button>
          </div>

          <div className="row g-3 mb-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-bold text-dark">
                Vrsta proizvoda (Šablon)
              </label>
              <select
                className="form-select form-select-lg border-primary"
                value={currentItem.productTemplateId}
                onChange={(e) =>
                  setCurrentItem({
                    ...currentItem,
                    productTemplateId: e.target.value,
                  })
                }
              >
                <option value="">-- Izaberi šablon --</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label fw-bold">Širina (W) mm</label>
              <input
                type="number"
                className="form-control form-control-lg fw-bold"
                placeholder="W"
                value={currentItem.widthW}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, widthW: e.target.value })
                }
              />
            </div>

            <div className="col-md-2">
              <label className="form-label fw-bold">Visina (H) mm</label>
              <input
                type="number"
                className="form-control form-control-lg fw-bold"
                placeholder="H"
                value={currentItem.heightH}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, heightH: e.target.value })
                }
              />
            </div>

            <div className="col-md-1">
              <label className="form-label fw-bold">Komada</label>
              <input
                type="number"
                className="form-control form-control-lg text-center fw-bold bg-light"
                min="1"
                value={currentItem.quantity}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, quantity: e.target.value })
                }
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-bold">Smer Otvaranja</label>
              <div className="d-flex gap-1">
                <button
                  className={`btn flex-fill fw-bold ${currentItem.openingDirection === "LEFT" ? "btn-dark" : "btn-outline-dark"}`}
                  onClick={() =>
                    setCurrentItem({ ...currentItem, openingDirection: "LEFT" })
                  }
                >
                  &larr; Levo
                </button>
                <button
                  className={`btn flex-fill fw-bold ${currentItem.openingDirection === "RIGHT" ? "btn-dark" : "btn-outline-dark"}`}
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
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-12">
              <label className="form-label fw-bold text-dark">
                Napomena za ovu stavku (Opciono)
              </label>
              <input
                type="text"
                className="form-control form-control-lg bg-light"
                placeholder={
                  currentItem.type === "SERVICE"
                    ? "Npr. Zadrži staru mrežicu, pukao donji kanap..."
                    : "Npr. Pazi na kosinu zida..."
                }
                value={currentItem.note}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, note: e.target.value })
                }
              />
            </div>
          </div>

          <button
            type="button"
            className={`btn btn-lg w-100 fw-bold fs-5 d-flex justify-content-center align-items-center ${currentItem.type === "SERVICE" ? "btn-outline-warning text-dark" : "btn-outline-primary"}`}
            onClick={handleAddItem}
          >
            <span className="fs-3 me-2" style={{ lineHeight: "1" }}>
              +
            </span>{" "}
            DODAJ U LISTU
          </button>
        </div>

        {/* SEKCIJA 3: LISTA DODATIH STAVKI */}
        {items.length > 0 && (
          <div className="card p-4 shadow-sm border-0 mb-4 rounded-4">
            <h5 className="text-success fw-bold mb-3">
              3. DODATE STAVKE ZA ŠTAMPANJE ({items.length})
            </h5>
            <div className="table-responsive mb-4 border rounded">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Tip Posla</th>
                    <th>Dimenzije</th>
                    <th>Kom</th>
                    <th>Vrsta / Šablon</th>
                    <th>Smer</th>
                    <th>Napomena</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr
                      key={idx}
                      className={item.type === "SERVICE" ? "table-warning" : ""}
                    >
                      <td>
                        <span
                          className={`badge ${item.type === "SERVICE" ? "bg-warning text-dark" : "bg-primary"} fs-6`}
                        >
                          {item.type === "SERVICE" ? "SERVIS" : "NOVO"}
                        </span>
                      </td>
                      <td className="fs-5 fw-bold">
                        {item.widthW} x {item.heightH}
                      </td>
                      <td className="fw-bold fs-5">{item.quantity}</td>
                      <td className="text-muted fw-bold">
                        {selectedTemplateName(item.productTemplate?.id)}
                      </td>
                      <td>
                        {item.openingDirection === "LEFT" ? "Levo" : "Desno"}
                      </td>
                      <td className="small fst-italic text-muted">
                        {item.note}
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger fw-bold"
                          onClick={() => handleRemoveItem(idx)}
                        >
                          Obriši
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              className="btn btn-success btn-lg w-100 fw-bold fs-4 shadow py-3"
              onClick={handleSubmitOrder}
            >
              ZAVRŠI I POŠALJI U RADIONICU
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminLayout;
