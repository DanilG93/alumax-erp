import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import {
  createWorkOrder,
  getCustomerSuggestions,
  getTemplates,
  getItemCalculations, // <-- Dodato za računanje mera pre štampe
} from "../api/api";

function AdminLayout() {
  const [orderHeader, setOrderHeader] = useState({
    customerName: "",
    protocolNumber: "",
    profileColor: "Bela",
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
    openingDirection: "LEFT",
    note: "",
  };

  const [currentItem, setCurrentItem] = useState(initialItemState);
  const [items, setItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [templates, setTemplates] = useState([]);

  // Stanje u koje smeštamo spreman nalog za štampu (zajedno sa izračunatim merama)
  const [printData, setPrintData] = useState(null);

  useEffect(() => {
    fetchSuggestions();
    fetchTemplates();
  }, []);

  // Čim se printData popuni (nakon čuvanja), automatski se okida prozor za štampanje!
  useEffect(() => {
    if (printData) {
      setTimeout(() => {
        window.print();
      }, 800); // 800ms pauze da se modal sigurno pojavi na ekranu pre štampe
    }
  }, [printData]);

  const fetchSuggestions = async () => {
    try {
      const response = await getCustomerSuggestions();
      setSuggestions(response.data);
    } catch (error) {}
  };

  const fetchTemplates = async () => {
    try {
      const response = await getTemplates();
      setTemplates(Array.isArray(response.data) ? response.data : []);
    } catch (error) {}
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
      // 1. Snimamo nalog u bazu
      const response = await createWorkOrder(payload);
      const savedOrder = response.data;

      // 2. Prolazimo kroz sve sačuvane stavke i pitamo behend za krojne liste
      const itemsWithCalculations = await Promise.all(
        savedOrder.items.map(async (item) => {
          if (item.type !== "SERVICE" && item.productTemplate) {
            try {
              const calcRes = await getItemCalculations(item.id);
              return { ...item, calculations: calcRes.data };
            } catch (err) {
              return { ...item, calculations: [] };
            }
          }
          return { ...item, calculations: [] };
        }),
      );

      // 3. Spajamo nalog sa krojnim listama i spremamo za štampu
      setPrintData({ ...savedOrder, items: itemsWithCalculations });

      // 4. Resetujemo unos za sledećeg kupca
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
    <>
      <div
        className="d-flex"
        style={{ minHeight: "100vh", backgroundColor: "#f4f6f9" }}
      >
        {/* DODATA KLASA "no-print" - Sakriva se cela forma kad krene štampa */}
        <div className="no-print d-flex w-100">
          <Sidebar />

          <div className="flex-grow-1 p-4 p-md-5 overflow-auto">
            {/* --- FORMA ZA UNOS (Glavni podaci) --- */}
            <div
              className={`card p-4 shadow-sm border-0 mb-4 rounded-4 ${orderHeader.isUrgent ? "border border-danger border-3 bg-danger bg-opacity-10" : "bg-white"}`}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="text-muted fw-bold mb-0">
                  1. GLAVNI PODACI NALOGA
                </h5>
                <div className="form-check form-switch fs-4 d-flex align-items-center">
                  <input
                    className={`form-check-input mt-0 ${orderHeader.isUrgent ? "bg-danger border-danger" : ""}`}
                    type="checkbox"
                    id="urgentSwitch"
                    checked={orderHeader.isUrgent}
                    onChange={(e) =>
                      setOrderHeader({
                        ...orderHeader,
                        isUrgent: e.target.checked,
                      })
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
                    Datum završetka{" "}
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

            {/* --- FORMA ZA UNOS (Konfiguracija stavke) --- */}
            <div className="card p-4 shadow-sm border-primary border-top border-4 mb-4 rounded-4 bg-white">
              <h5 className="text-primary fw-bold mb-4">
                2. KONFIGURACIJA STAVKE
              </h5>
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
                      setCurrentItem({
                        ...currentItem,
                        heightH: e.target.value,
                      })
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
                      setCurrentItem({
                        ...currentItem,
                        quantity: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Smer Otvaranja</label>
                  <div className="d-flex gap-1">
                    <button
                      className={`btn flex-fill fw-bold ${currentItem.openingDirection === "LEFT" ? "btn-dark" : "btn-outline-dark"}`}
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

            {/* --- LISTA DODATIH STAVKI --- */}
            {items.length > 0 && (
              <div className="card p-4 shadow-sm border-0 mb-4 rounded-4">
                <h5 className="text-success fw-bold mb-3">
                  3. DODATE STAVKE ({items.length})
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
                          className={
                            item.type === "SERVICE" ? "table-warning" : ""
                          }
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
                            {item.openingDirection === "LEFT"
                              ? "Levo"
                              : "Desno"}
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
                  ZAVRŠI, SAČUVAJ I ŠTAMPAJ NALOG
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- OVERLAY MODAL ZA AUTOMATSKU ŠTAMPU NALOGA --- */}
      {printData && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.85)", zIndex: 1050 }}
        >
          <div
            className="card shadow-lg border-0 rounded-4 d-flex flex-column"
            style={{ width: "95%", maxWidth: "900px", maxHeight: "95vh" }}
          >
            {/* Zaglavlje modala koje se ne štampa */}
            <div className="card-header bg-white p-4 d-flex justify-content-between align-items-center border-bottom rounded-top-4 no-print">
              <h4 className="fw-bold m-0 text-success">
                ✅ Nalog Uspešno Kreiran
              </h4>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary fw-bold px-4"
                  onClick={() => window.print()}
                >
                  🖨️ PONOVI ŠTAMPU
                </button>
                <button
                  className="btn btn-secondary fw-bold px-4"
                  onClick={() => setPrintData(null)}
                >
                  ZATVORI I NASTAVI
                </button>
              </div>
            </div>

            {/* --- SADRŽAJ KOJI IDE NA ŠTAMPAČ (A4 Format) --- */}
            <div
              id="print-area"
              className="card-body overflow-auto p-4 p-md-5 bg-white rounded-bottom-4"
            >
              <div className="text-center mb-4 pb-3 border-bottom border-2 border-dark">
                <h1 className="fw-bold text-uppercase mb-2">
                  Radni Nalog / Otpremnica
                </h1>
                <h3 className="text-muted">
                  Protokol: #{printData.protocolNumber || "N/A"}
                </h3>
              </div>

              <div className="row mb-4 fs-5">
                <div className="col-6">
                  <p className="mb-2">
                    <strong>Naručilac:</strong> {printData.customerName}
                  </p>
                  <p className="mb-2">
                    <strong>Boja profila:</strong>{" "}
                    {printData.profileColor || "Nije navedena"}
                  </p>
                  {printData.isUrgent && (
                    <p className="mb-2 text-danger border border-danger d-inline-block px-2 py-1 fw-bold">
                      HITAN NALOG!
                    </p>
                  )}
                </div>
                <div className="col-6 text-end">
                  <p className="mb-2">
                    <strong>Datum isporuke/montaže:</strong>{" "}
                    {printData.deliveryDate || "-"}
                  </p>
                  <p className="mb-2">
                    <strong>Lokacija:</strong>{" "}
                    {printData.requiresDelivery
                      ? printData.deliveryAddress
                      : "Lično preuzimanje"}
                  </p>
                </div>
              </div>

              {/* Tabela svih komarnika sa Krojnim Listama */}
              <div className="border border-dark mb-5">
                <div className="bg-light fw-bold fs-5 p-2 border-bottom border-dark text-center">
                  SPISAK STAVKI I MERE ZA SEČENJE
                </div>

                {printData.items && printData.items.length > 0 ? (
                  printData.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 border-bottom border-secondary"
                    >
                      <div className="row fs-5 fw-bold mb-2 align-items-center">
                        <div className="col-auto">
                          <span className="badge bg-dark fs-5">{idx + 1}.</span>
                        </div>
                        <div className="col-3">
                          Ulaz:{" "}
                          <span className="fs-4">
                            {item.widthW} x {item.heightH}
                          </span>
                        </div>
                        <div className="col-4">
                          {item.productTemplate?.name || "Standard"}{" "}
                          {item.type === "SERVICE" ? "(SERVIS)" : ""}
                        </div>
                        <div className="col-2 text-center">
                          Smer:{" "}
                          {item.openingDirection === "LEFT" ? "Levo" : "Desno"}
                        </div>
                        <div className="col-2 text-end text-primary fs-4">
                          Kom: {item.quantity}
                        </div>
                      </div>

                      {item.note && (
                        <div className="text-danger fw-bold fst-italic mb-2 ps-5">
                          Napomena: {item.note}
                        </div>
                      )}

                      {/* Ispis Krojne liste tačno ispod svake stavke */}
                      {item.type !== "SERVICE" &&
                        item.calculations &&
                        item.calculations.length > 0 && (
                          <div className="bg-light p-2 ps-5 ms-3 rounded border">
                            <strong className="d-block mb-1 text-muted text-uppercase small">
                              ✂️ Mere za sečenje (1 komad):
                            </strong>
                            <div className="d-flex flex-wrap gap-4">
                              {item.calculations.map((calc, cIdx) => (
                                <span key={cIdx} className="fs-5">
                                  {calc.quantity}x{" "}
                                  <strong>{calc.elementName}</strong>:{" "}
                                  <u className="fw-bold">
                                    {calc.resultValue} mm
                                  </u>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  ))
                ) : (
                  <div className="text-muted py-4 text-center">
                    Nema stavki.
                  </div>
                )}
              </div>

              <div className="row mt-5 pt-3">
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

export default AdminLayout;
