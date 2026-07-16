import { useState, useEffect } from "react";
import {
  getTemplates,
  createTemplate,
  deleteTemplate,
  updateTemplate,
} from "../api/api";

function SettingsLayout() {
  const [templates, setTemplates] = useState([]);
  const [templateName, setTemplateName] = useState("");
  const [rules, setRules] = useState([]);
  const [notes, setNotes] = useState([]);

  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [editingRuleIndex, setEditingRuleIndex] = useState(null);

  const [newRule, setNewRule] = useState({
    elementName: "",
    targetDimension: "HEIGHT",
    operation: "SUBTRACT",
    ruleType: "FIXED",
    inputValue: "",
    variableName: "",
    quantityMultiplier: 1,
  });

  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await getTemplates();
      setTemplates(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Greška pri učitavanju šablona:", error);
    }
  };

  const handleAddRule = () => {
    if (
      !newRule.elementName ||
      !newRule.inputValue ||
      newRule.quantityMultiplier < 1
    ) {
      alert("Molimo unesite naziv dela, vrednost/formulu i količinu!");
      return;
    }

    const ruleToSave = {
      elementName: newRule.elementName,
      targetDimension:
        newRule.ruleType === "FIXED" ? newRule.targetDimension : null,
      operation: newRule.ruleType === "FIXED" ? newRule.operation : null,
      ruleType: newRule.ruleType,
      quantityMultiplier: newRule.quantityMultiplier,
      variableName:
        newRule.variableName.trim() !== ""
          ? newRule.variableName.trim().toUpperCase()
          : null,
    };

    if (newRule.ruleType === "FIXED") {
      ruleToSave.value = parseFloat(newRule.inputValue);
      ruleToSave.formula = null;
    } else {
      ruleToSave.value = null;
      ruleToSave.formula = newRule.inputValue;
    }

    if (editingRuleIndex !== null) {
      const updatedRules = [...rules];
      updatedRules[editingRuleIndex] = ruleToSave;
      setRules(updatedRules);
      setEditingRuleIndex(null);
    } else {
      setRules([...rules, ruleToSave]);
    }

    setNewRule({
      elementName: "",
      targetDimension: "HEIGHT",
      operation: "SUBTRACT",
      ruleType: "FIXED",
      inputValue: "",
      variableName: "",
      quantityMultiplier: 1,
    });
  };

  const handleEditRule = (index) => {
    const r = rules[index];
    setNewRule({
      elementName: r.elementName,
      targetDimension: r.targetDimension || "HEIGHT",
      operation: r.operation || "SUBTRACT",
      ruleType: r.ruleType || "FIXED",
      inputValue: r.ruleType === "FIXED" ? r.value : r.formula,
      variableName: r.variableName || "",
      quantityMultiplier: r.quantityMultiplier,
    });
    setEditingRuleIndex(index);
  };

  const handleRemoveRule = (indexToRemove) => {
    setRules(rules.filter((_, index) => index !== indexToRemove));
    if (editingRuleIndex === indexToRemove) {
      setEditingRuleIndex(null);
      setNewRule({
        elementName: "",
        targetDimension: "HEIGHT",
        operation: "SUBTRACT",
        ruleType: "FIXED",
        inputValue: "",
        variableName: "",
        quantityMultiplier: 1,
      });
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setNotes([...notes, newNote]);
    setNewNote("");
  };

  const handleRemoveNote = (indexToRemove) => {
    setNotes(notes.filter((_, index) => index !== indexToRemove));
  };

  const handleEditTemplate = (t) => {
    setEditingTemplateId(t.id);
    setTemplateName(t.name);
    setNotes(t.notes ? [...t.notes] : []);

    const loadedRules = (t.cuttingRules || []).map((r) => ({
      elementName: r.elementName,
      targetDimension: r.targetDimension || "HEIGHT",
      operation: r.operation || "SUBTRACT",
      ruleType: r.ruleType || "FIXED",
      inputValue: r.ruleType === "FIXED" ? r.value : r.formula,
      variableName: r.variableName || "",
      quantityMultiplier: r.quantityMultiplier,
    }));
    setRules(loadedRules);
    setEditingRuleIndex(null);
    window.scrollTo(0, 0);
  };

  const handleCancelEdit = () => {
    setEditingTemplateId(null);
    setTemplateName("");
    setRules([]);
    setNotes([]);
    setEditingRuleIndex(null);
    setNewRule({
      elementName: "",
      targetDimension: "HEIGHT",
      operation: "SUBTRACT",
      ruleType: "FIXED",
      inputValue: "",
      variableName: "",
      quantityMultiplier: 1,
    });
  };

  const handleSaveTemplate = async () => {
    if (!templateName || rules.length === 0) {
      alert("Šablon mora imati ime i barem jedno pravilo!");
      return;
    }

    const payload = {
      name: templateName,
      cuttingRules: rules,
      notes: notes,
    };

    try {
      if (editingTemplateId) {
        await updateTemplate(editingTemplateId, payload);
        alert("Šablon uspešno IZMENJEN!");
      } else {
        await createTemplate(payload);
        alert("Novi šablon uspešno SAČUVAN!");
      }
      handleCancelEdit();
      fetchTemplates();
    } catch (error) {
      console.error("Greška:", error);
      alert("Greška pri čuvanju. Proveri konzolu.");
    }
  };

  return (
    <div
      className="d-flex"
      style={{ minHeight: "100vh", backgroundColor: "#f4f6f9" }}
    >
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
          <li>
            <a href="/admin" className="nav-link text-white fs-5">
              Nova Narudžbina
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className="nav-link active fw-bold fs-5">
              Podešavanja
            </a>
          </li>
        </ul>
      </div>

      <div className="flex-grow-1 p-4 p-md-5 overflow-auto">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold text-dark">Podešavanja Šablona</h2>
          {editingTemplateId && (
            <span className="badge bg-warning text-dark fs-5 shadow-sm">
              REŽIM IZMENE AKTIVAN
            </span>
          )}
        </div>

        <div className="row g-4">
          <div className="col-xl-7">
            <div
              className={`card p-4 shadow-sm border-0 rounded-4 ${editingTemplateId ? "border border-warning border-3" : ""}`}
            >
              <div className="mb-4">
                <label className="form-label fw-bold">Ime Šablona</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>

              {/* SEKCIJA ZA PRAVILA */}
              <div
                className={`p-3 rounded-3 mb-4 border ${editingRuleIndex !== null ? "bg-warning bg-opacity-10 border-warning" : "bg-light"}`}
              >
                <h6 className="fw-bold mb-3">Pravilo sečenja</h6>

                <div className="row g-2 mb-2">
                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-muted mb-1">
                      Naziv dela
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Npr. RAM"
                      value={newRule.elementName}
                      onChange={(e) =>
                        setNewRule({ ...newRule, elementName: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-muted mb-1">
                      Tip pravila
                    </label>
                    <select
                      className="form-select"
                      value={newRule.ruleType}
                      onChange={(e) =>
                        setNewRule({ ...newRule, ruleType: e.target.value })
                      }
                    >
                      <option value="FIXED">Fiksno računanje</option>
                      <option value="FORMULA">Specijalna Formula</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small fw-bold text-muted mb-1">
                      Količina
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={newRule.quantityMultiplier}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          quantityMultiplier: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-info mb-1">
                      Oznaka (Opciono)
                    </label>
                    <input
                      type="text"
                      className="form-control border-info fw-bold"
                      placeholder="Npr. P"
                      value={newRule.variableName}
                      onChange={(e) =>
                        setNewRule({ ...newRule, variableName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="row g-2 align-items-end">
                  {newRule.ruleType === "FIXED" && (
                    <>
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-muted mb-1">
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
                        <label className="form-label small fw-bold text-muted mb-1">
                          Matematika
                        </label>
                        <select
                          className="form-select"
                          value={newRule.operation}
                          onChange={(e) =>
                            setNewRule({
                              ...newRule,
                              operation: e.target.value,
                            })
                          }
                        >
                          <option value="SUBTRACT">Oduzmi (-)</option>
                          <option value="ADD">Dodaj (+)</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div
                    className={
                      newRule.ruleType === "FIXED" ? "col-md-4" : "col-md-12"
                    }
                  >
                    <label className="form-label small fw-bold text-muted mb-1">
                      {newRule.ruleType === "FIXED"
                        ? "Vrednost (mm)"
                        : "Unesi Formulu (koristi W i H)"}
                    </label>
                    <input
                      type="text"
                      className="form-control fw-bold"
                      placeholder={
                        newRule.ruleType === "FIXED"
                          ? "Npr. 80"
                          : "Npr. (W*2 + H*2) * 1.0164"
                      }
                      value={newRule.inputValue}
                      onChange={(e) =>
                        setNewRule({ ...newRule, inputValue: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-12 mt-3">
                    <button
                      className={`btn w-100 fw-bold ${editingRuleIndex !== null ? "btn-warning text-dark" : "btn-outline-primary"}`}
                      onClick={handleAddRule}
                    >
                      {editingRuleIndex !== null
                        ? "SAČUVAJ IZMENE U PRAVILU"
                        : "DODAJ PRAVILO U LISTU"}
                    </button>
                  </div>
                </div>
              </div>

              {/* SEKCIJA ZA NAPOMENE */}
              <div className="bg-light p-3 rounded-3 mb-4 border">
                <h6 className="fw-bold text-dark mb-3">
                  Tekstualne napomene za radni nalog
                </h6>
                <div className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Npr: Donji kanap ide na 50mm..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                  />
                  <button
                    className="btn btn-secondary fw-bold text-nowrap"
                    onClick={handleAddNote}
                  >
                    Dodaj napomenu
                  </button>
                </div>
              </div>

              {/* PREGLED DODATOG */}
              {(rules.length > 0 || notes.length > 0) && (
                <div className="mb-4 p-3 border rounded-3 bg-white shadow-sm">
                  <h6 className="fw-bold text-success mb-3">
                    Spremno za čuvanje:
                  </h6>
                  {rules.length > 0 && (
                    <div className="mb-3">
                      <strong className="small text-muted text-uppercase">
                        Pravila za sečenje
                      </strong>
                      <ul className="list-group mt-2">
                        {rules.map((r, idx) => (
                          <li
                            key={idx}
                            className={`list-group-item d-flex justify-content-between align-items-center py-2 ${editingRuleIndex === idx ? "list-group-item-warning" : ""}`}
                          >
                            <span>
                              <strong className="fs-6">{r.elementName}</strong>
                              <span className="badge bg-secondary ms-2">
                                {r.quantityMultiplier} kom
                              </span>
                              {r.variableName && (
                                <span className="badge bg-info text-dark ms-2">
                                  Oznaka: {r.variableName}
                                </span>
                              )}
                            </span>
                            <div className="d-flex align-items-center gap-3">
                              <span className="text-muted fw-bold">
                                {r.ruleType === "FIXED" ? (
                                  <>
                                    {r.targetDimension === "HEIGHT"
                                      ? "Visina"
                                      : "Širina"}{" "}
                                    {r.operation === "SUBTRACT" ? "-" : "+"}{" "}
                                    {r.value} mm
                                  </>
                                ) : (
                                  <span className="text-primary">
                                    Formula: {r.formula}
                                  </span>
                                )}
                              </span>
                              <div className="btn-group">
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleEditRule(idx)}
                                >
                                  Izmeni
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleRemoveRule(idx)}
                                >
                                  Obriši
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {notes.length > 0 && (
                    <div>
                      <strong className="small text-muted text-uppercase">
                        Napomene
                      </strong>
                      <ul className="list-group mt-2">
                        {notes.map((note, idx) => (
                          <li
                            key={idx}
                            className="list-group-item d-flex justify-content-between align-items-center py-2 bg-light"
                          >
                            <span>{note}</span>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleRemoveNote(idx)}
                            >
                              Obriši
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="d-flex gap-2">
                <button
                  className={`btn ${editingTemplateId ? "btn-warning text-dark" : "btn-success"} btn-lg flex-grow-1 fw-bold shadow`}
                  onClick={handleSaveTemplate}
                >
                  {editingTemplateId ? "SAČUVAJ IZMENE" : "SAČUVAJ NOVI ŠABLON"}
                </button>
                {editingTemplateId && (
                  <button
                    className="btn btn-secondary btn-lg fw-bold shadow"
                    onClick={handleCancelEdit}
                  >
                    Otkaži
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="col-xl-5">
            <div className="card p-4 shadow-sm border-0 rounded-4">
              <h5 className="fw-bold mb-4">SAČUVANI ŠABLONI</h5>
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="border rounded p-3 mb-3 bg-white shadow-sm"
                >
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <strong className="fs-5 text-primary">{t.name}</strong>
                    <div className="btn-group">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleEditTemplate(t)}
                      >
                        Izmeni
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() =>
                          deleteTemplate(t.id).then(fetchTemplates)
                        }
                      >
                        Obriši
                      </button>
                    </div>
                  </div>

                  {t.cuttingRules && t.cuttingRules.length > 0 && (
                    <div className="mb-2">
                      <span className="small fw-bold text-muted">
                        Elementi:
                      </span>
                      <ul className="list-unstyled ms-2 mb-0 mt-1">
                        {t.cuttingRules.map((rule, idx) => (
                          <li
                            key={idx}
                            className="small border-bottom pb-1 mb-1 d-flex justify-content-between"
                          >
                            <span>
                              {rule.quantityMultiplier}x{" "}
                              <strong>{rule.elementName}</strong>
                              {rule.variableName && (
                                <span className="badge bg-info text-dark ms-1">
                                  [{rule.variableName}]
                                </span>
                              )}
                            </span>
                            <span className="text-muted">
                              {rule.ruleType === "FIXED" ? (
                                <>
                                  (
                                  {rule.targetDimension === "HEIGHT"
                                    ? "H"
                                    : "W"}{" "}
                                  {rule.operation === "SUBTRACT" ? "-" : "+"}{" "}
                                  {rule.value})
                                </>
                              ) : (
                                <span className="text-primary fw-bold">
                                  [{rule.formula}]
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {t.notes && t.notes.length > 0 && (
                    <div className="mt-2">
                      <span className="small fw-bold text-muted">
                        Napomene:
                      </span>
                      <ul className="list-unstyled ms-2 mb-0 mt-1">
                        {t.notes.map((note, idx) => (
                          <li key={idx} className="small text-secondary mb-1">
                            • {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsLayout;
