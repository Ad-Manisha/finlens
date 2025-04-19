import React from 'react';
import { FaHome, FaWallet, FaQuestionCircle, FaPlus, FaChartLine } from 'react-icons/fa'; // Using react-icons for favicons
import './Home.css'; // External CSS for styling

const Home = () => {
  return (
    <div className="home-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="profile-section">
          {/* Circular profile image */}
          <img src="/path/to/profile.jpg" alt="Profile" className="profile-img" />
          <h6>Welcome ! Mr.X</h6>
        </div>
        <ul className="sidebar-links">
          <li><FaHome /> Home</li>
          <li><FaWallet /> Expenses</li>
          <li><FaQuestionCircle /> Support</li>
        </ul>
        <div className="sidebar-logo">
          <img src="/path/to/finlens-logo.png" alt="FinLens Logo" className="logo-img" />
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-boxes">
          {/* Recent Expenses */}
          <div className="box recent-expenses">
            <h3>Recent Expenses</h3>
            {/* Add expense items here */}
          </div>

          {/* Quick Access */}
          <div className="box quick-access">
            <h3>Quick Access</h3>
            <button><FaPlus /> Add Receipt</button>
            <button><FaChartLine /> Create Report</button>
          </div>
        </div>

        {/* Monthly Report */}
        <div className="monthly-report">
          <h3>Monthly Report</h3>
          {/* Display monthly report data here */}
        </div>
      </div>
    </div>
  );
}

export default Home;
