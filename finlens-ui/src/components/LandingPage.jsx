import React from 'react';
import { FaHome } from 'react-icons/fa';

import { Link } from 'react-router-dom';

const Home = () => {
  const isLoggedIn = true;
  return (
    <>
      <div className="landing">
        <div className="wrapper">
          <div className="d-flex flex-column justify-content-center align-items-center h-100">
            <p className="display-1">FinLens</p>

            <p className="display-6">
              Welcome to FinLens,
              An AI powered expense tracker.
            </p>
            <div>

              <Link
                className="btn btn-warning btn-lg"
                // to={isLoggedIn ? '/home' : '/'}
                to={!isLoggedIn ? '/' : '/home'}
              >
                <FaHome />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;

