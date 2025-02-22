import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
      <nav className={`navbar navbar-dark ${props.color} navbar-expand-sm`}>
        <div className="container">
          <Link to="/" className="navbar-brand">
            <SiCashapp className="text-white mb-1 mx-1" />
            {props.header}
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
                <Link className="nav-link" aria-current="page" to="/">
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/signup">
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
                  <button className="btn btn-link nav-link" onClick={handleLogout}>
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


