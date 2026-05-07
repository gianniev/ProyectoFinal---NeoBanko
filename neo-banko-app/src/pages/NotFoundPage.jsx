import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <section className="page not-found">
      <div className="card">
        <p className="eyebrow">404</p>
        <h1>Pagina no encontrada</h1>
        <p>La ruta que intentas abrir no existe todavia.</p>
        <Link className="button button-primary" to="/">
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}

export default NotFoundPage;
