import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { SiCashapp } from "react-icons/si";

const NavBar = (props) => {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem("user") ? true : false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove user data from localStorage and update the state
    console.log("logOut clicked");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    navigate("/");
  };

  // Effect to check localStorage and update the login state
  useEffect(() => {
    const checkLoginStatus = () => {
      setIsLoggedIn(localStorage.getItem("user") ? true : false);
    };

    // Listen to changes in localStorage
    window.addEventListener("storage", checkLoginStatus);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("storage", checkLoginStatus);
    };
  }, []);


  return (
    <>
      <nav className={`navbar navbar-expand-sm ${props.color} border-bottom`} style={{ backgroundColor: '#0f172a', borderBottom: '2px solid #10b981' }}>
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <Link to="/" className="navbar-brand d-flex align-items-center text-white">
            <SiCashapp className="me-2" style={{ color: '#10b981', fontSize: '1.5rem' }} />
            <span style={{ fontWeight: 600 }}>{props.header}</span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <NavLink className="nav-link text-light" activeclassname="active" to="/">
                  Home
                </NavLink>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-light" to="/signup">
                  Register
                </Link>
              </li>
              {/* {isLoggedIn && (
                <li className="nav-item">
                  <Link className="nav-link" onClick={handleLogout}>
                    Logout
                  </Link>
                </li>
              )} */}
              {isLoggedIn && (
                <li className="nav-item">
                  {/* Use button instead of Link */}
                  <button className="btn btn-link nav-link text-light" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};

export default NavBar;
