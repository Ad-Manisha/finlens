import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 text-center">
      <h1 className="display-1 fw-bold text-danger">404</h1>
      <h2 className="mb-3">Oops! Page Not Found</h2>
      <p className="text-muted">
        The page you are looking for might have been removed or does not exist.
      </p>
      <Link to="/home" className="btn btn-primary mt-3">
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFound;
