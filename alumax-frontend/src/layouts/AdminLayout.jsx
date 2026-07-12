function AdminLayout() {
  return (
    <div
      className="container-fluid bg-secondary"
      style={{ minHeight: "100vh" }}
    >
      <div className="row">
        <div className="col-2 bg-dark text-white vh-100 p-3">
          <h4>📋 ALUMAX ERP</h4>
          <hr />
          <p>👤 Admin Panel</p>
        </div>
        <div className="col-10 p-4">
          <h1>Administracija</h1>
          <p>Ovde će biti tabele i forme za upravljanje.</p>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
