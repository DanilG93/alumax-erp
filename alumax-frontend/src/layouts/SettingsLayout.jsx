import { useState, useEffect } from "react";
import { getTemplates, createTemplate, deleteTemplate } from "../api/api";

function SettingsLayout() {
  const [templates, setTemplates] = useState([]);
  const [templateName, setTemplateName] = useState("");
  const [rules, setRules] = useState([]);

  const [newRule, setNewRule] = useState({
    name: "",
    targetDimension: "HEIGHT", // HEIGHT ili WIDTH
    operation: "SUBTRACT", // SUBTRACT ili ADD
    value: "",
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await getTemplates();
      // Opet koristimo tvoj zaštitni bedem za nizove
      setTemplates(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Greška pri učitavanju šablona:", error);
    }
  };

  const handleAddRule = () => {
    if (!newRule.name || !newRule.value) {
      alert("Molimo unesite ime pravila i vrednost (mm).");
      return;
    }
    setRules([...rules, newRule]);
    // Resetuj formu za sledeće pravilo
    setNewRule({ ...newRule, name: "", value: "" });
  };

  const handleRemoveRule = (indexToRemove) => {
    setRules(rules.filter((_, index) => index !== indexToRemove));
  };

  const handleSaveTemplate = async () => {
    if (!templateName || rules.length === 0) {
      alert("Šablon mora imati ime i barem jedno pravilo za sečenje!");
      return;
    }

    const payload = {
      name: templateName,
      rules: rules,
    };

    try {
      await createTemplate(payload);
      alert("Šablon uspešno sačuvan u bazu!");
      setTemplateName("");
      setRules([]);
      fetchTemplates();
    } catch (error) {
      console.error("Greška pri kreiranju šablona:", error);
      alert("Došlo je do greške. Proverite F12 konzolu.");
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (
      window.confirm("Da li ste sigurni da želite da obrišete ovaj šablon?")
    ) {
      try {
        await deleteTemplate(id);
        fetchTemplates();
      } catch (error) {
        console.error("Greška pri brisanju:", error);
      }
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
          <li>
            <a href="#" className="nav-link text-white fs-5 opacity-75">
              📝 Nova Narudžbina
            </a>
          </li>
          <li>
            <a href="#" className="nav-link text-white fs-5 opacity-75">
              📋 Lista Naloga
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className="nav-link active fw-bold fs-5">
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
        <h2 className="mb-4 fw-bold text-dark">Matematika i Sečenje</h2>

        <div className="row">
          {/* LEVA STRANA: UNOS NOVOG ŠABLONA */}
          <div className="col-lg-6">
            <div className="card p-4 shadow-sm border-0 mb-4 rounded-4">
              <h5 className="text-primary fw-bold mb-4">
                1. KREIRAJ NOVI ŠABLON
              </h5>

              <div className="mb-4">
                <label className="form-label fw-bold">
                  Ime Šablona (Npr: Maxi Line - Niski Prag)
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Unesite naziv..."
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>

              <div className="bg-light p-3 rounded mb-3 border">
                <h6 className="fw-bold text-muted mb-3">
                  Dodaj pravilo sečenja
                </h6>
                <div className="row g-2 align-items-end">
                  <div className="col-md-12 mb-2">
                    <label className="form-label small fw-bold">
                      Naziv dela (npr. Vertikalni ram)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={newRule.name}
                      onChange={(e) =>
                        setNewRule({ ...newRule, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">
                      Odnosi se na
                    </label>
                    <select
                      className="form-select"
                      value={newRule.targetDimension}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          targetDimension: e.target.value,
                        })
                      }
                    >
                      <option value="HEIGHT">Visinu (H)</option>
                      <option value="WIDTH">Širinu (W)</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">
                      Matematika
                    </label>
                    <select
                      className="form-select"
                      value={newRule.operation}
                      onChange={(e) =>
                        setNewRule({ ...newRule, operation: e.target.value })
                      }
                    >
                      <option value="SUBTRACT">Oduzmi (-)</option>
                      <option value="ADD">Dodaj (+)</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">
                      Vrednost (mm)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Npr. 38"
                      value={newRule.value}
                      onChange={(e) =>
                        setNewRule({ ...newRule, value: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-12 mt-3">
                    <button
                      className="btn btn-outline-primary w-100 fw-bold"
                      onClick={handleAddRule}
                    >
                      ➕ DODAJ PRAVILO U LISTU
                    </button>
                  </div>
                </div>
              </div>

              {/* LISTA DODATIH PRAVILA PRE ČUVANJA */}
              {rules.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-bold text-success mb-2">
                    Spremna pravila za ovaj šablon:
                  </h6>
                  <ul className="list-group">
                    {rules.map((r, idx) => (
                      <li
                        key={idx}
                        className="list-group-item d-flex justify-content-between align-items-center bg-white"
                      >
                        <div>
                          <span className="fw-bold">{r.name}</span> <br />
                          <small className="text-muted">
                            Uzmi{" "}
                            {r.targetDimension === "HEIGHT"
                              ? "Visinu"
                              : "Širinu"}{" "}
                            komarnika i{" "}
                            {r.operation === "SUBTRACT" ? "oduzmi" : "dodaj"}{" "}
                            <strong>{r.value} mm</strong>
                          </small>
                        </div>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemoveRule(idx)}
                        >
                          ✖
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                className="btn btn-success btn-lg w-100 fw-bold shadow-sm"
                onClick={handleSaveTemplate}
              >
                💾 SAČUVAJ ŠABLON U BAZU
              </button>
            </div>
          </div>

          {/* DESNA STRANA: SPISAK POSTOJEĆIH ŠABLONA */}
          <div className="col-lg-6">
            <div className="card p-4 shadow-sm border-0 rounded-4">
              <h5 className="text-dark fw-bold mb-4">2. SAČUVANI ŠABLONI</h5>
              {templates.length === 0 ? (
                <p className="text-muted">
                  Trenutno nema sačuvanih šablona u bazi.
                </p>
              ) : (
                <div className="accordion" id="templatesAccordion">
                  {templates.map((template, index) => (
                    <div
                      className="accordion-item mb-2 border rounded"
                      key={template.id}
                    >
                      <h2 className="accordion-header">
                        <button
                          className="accordion-button collapsed fw-bold"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#collapse${index}`}
                        >
                          ⚙️ {template.name}
                        </button>
                      </h2>
                      <div
                        id={`collapse${index}`}
                        className="accordion-collapse collapse"
                        data-bs-parent="#templatesAccordion"
                      >
                        <div className="accordion-body bg-light">
                          <ul className="list-unstyled m-0">
                            {template.rules &&
                              template.rules.map((rule, rIdx) => (
                                <li
                                  key={rIdx}
                                  className="mb-1 border-bottom pb-1"
                                >
                                  <strong>{rule.name}</strong>:{" "}
                                  {rule.targetDimension}{" "}
                                  {rule.operation === "SUBTRACT" ? "-" : "+"}{" "}
                                  {rule.value}mm
                                </li>
                              ))}
                          </ul>
                          <button
                            className="btn btn-outline-danger btn-sm mt-3 w-100 fw-bold"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            🗑️ OBRIŠI CEO ŠABLON
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsLayout;
