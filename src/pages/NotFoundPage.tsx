import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="page not-found">
      <h1>Página no encontrada</h1>
      <p className="lead">Esa ruta no existe en SurcoIA.</p>
      <Link to="/" className="btn btn-primary">
        Volver al inicio
      </Link>
    </div>
  );
}
