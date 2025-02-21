import React, { useState } from 'react';
import { FaHome, FaWallet, FaQuestionCircle, FaPlus, FaChartLine, FaUser } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './Home.css';


ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Home = () => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [receiptData, setReceiptData] = useState({
    subject: '',
    amount: ''
  });

  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReceiptData({
      ...receiptData,
      [name]: value
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!receiptData.subject || !receiptData.amount) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receiptData),
      });

      if (response.ok) {
        setError('');
        alert("Receipt added successfully!");
        setReceiptData({ subject: '', amount: '' });
        setIsFormVisible(false);
      } else {
        setError("Error adding receipt.");
      }
    } catch (error) {
      setError("Error: " + error.message);
    }
  };

  // Dummy data for the bar chart
  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Expenses ($)',
        data: [120, 150, 90, 170, 80, 200],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="home-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="profile-section">
        {/* <i class="fa fa-user" aria-hidden="true">Profile</i> */}
        <FaUser /> Profile
        </div>
        <ul className="sidebar-links">
          <li><FaHome /> Home</li>
          <li><FaWallet /> Expenses</li>
          <li><FaQuestionCircle /> Support</li>
        </ul>
        <div className="sidebar-bottom">
          <span className="finlens-text">FinLens</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-boxes">
          {/* Recent Expenses */}
          <div className="box recent-expenses">
            <h3>Recent Expenses</h3>
            <table className="expense-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Amount ($)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Food</td>
                  <td>50</td>
                </tr>
                <tr>
                  <td>Transportation</td>
                  <td>30</td>
                </tr>
                <tr>
                  <td>Entertainment</td>
                  <td>20</td>
                </tr>
                <tr>
                  <td>Shopping</td>
                  <td>70</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Quick Access */}
          <div className="box quick-access">
            <h3>Quick Access</h3>
            <div className="quick-access-buttons">
              <button className="orange" onClick={() => setIsFormVisible(true)}><FaPlus /> Add Receipt</button>
              <button className="orange"><FaChartLine /> Create Report</button>
            </div>
          </div>
        </div>

        {/* Receipt Form (Conditional Rendering) */}
        {isFormVisible && (
          <div className="box receipt-form">
            <h3>Add Receipt</h3>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleFormSubmit}>
              <label>
                Subject:
                <input
                  type="text"
                  name="subject"
                  value={receiptData.subject}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                Amount ($):
                <input
                  type="number"
                  name="amount"
                  value={receiptData.amount}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <button type="submit">Submit</button>
              <button type="button" onClick={() => setIsFormVisible(false)}>Cancel</button>
            </form>
          </div>
        )}

        {/* Monthly Report */}
        <div className="box monthly-report">
          <h3>Monthly Report</h3>
          <div className="bar-chart-container">
            <Bar data={data} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
