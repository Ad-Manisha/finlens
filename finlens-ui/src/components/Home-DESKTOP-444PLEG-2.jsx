import React, { useState } from 'react';
import { FaHome, FaWallet, FaQuestionCircle, FaPlus, FaChartLine, FaUser } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './Home.css';
import { SiCoggle } from 'react-icons/si';
import { Link } from 'react-router-dom';


ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Home = () => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [file, setFile] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [categorizedData, setCategorizedData] = useState({});

  const authUser = localStorage.getItem('user');
  const parsedUser = authUser ? JSON.parse(authUser) : null;

  const [error, setError] = useState('');

  const categorizeText = async (text) => {
    try {
      const response = await fetch('http://localhost:8000/categorize-expense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      const result = await response.json();
      console.log("Categorized:", result.categorized);

      setCategorizedData(result.categorized);

      alert("Categorization successful!");
    } catch (err) {
      console.error("Error:", err);
    }
  };


  const handleInputChange = (e) => {
    setFile(e.target.files[0]);
  };


  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("PLease Select an Image.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/extract-text', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        console.log("OCR text :", result);
        setOcrText(result.text);  // Display the OCR'd text
        categorizeText(result.text);
        setError('');
        /* setIsFormVisible(false); */
        alert("Text Extracted successfully!");
      } else {
        setError(result.detail || "Failed to extract text.");
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
          <FaUser /> {parsedUser.user.name}
        </div>
        <ul className="sidebar-links">
          <li><Link to="/"><FaHome /> Home</Link> </li>
          <li><FaWallet /> Expenses</li>
          <li><FaQuestionCircle /> Support</li>
        </ul>
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
                Upload Receipt Image:
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                />
              </label>
              <div>
                <button className="orange">Submit</button>
                <button className="btn btn-danger btn-sm ms-2" type="button" onClick={() => setIsFormVisible(false)}>Cancel</button>
              </div>
            </form>

            {ocrText && (
              <div className="box">
                <h4>Extracted Text:</h4>
                <pre>{ocrText}</pre>
              </div>
            )}

            {Object.keys(categorizedData).length > 0 && (
              <div className="box">
                <h4>Categorized Expenses:</h4>
                <table className="expense-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Amount ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(categorizedData).map(([category, amount]) => (
                      <tr key={category}>
                        <td>{category}</td>
                        <td>{amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}


          </div>
        )}

        {/* Monthly Report */}
        {Object.keys(categorizedData).length > 0 && (
          <div className="box">
            <h4>Expense Breakdown Chart:</h4>
            <Bar
              data={{
                labels: Object.keys(categorizedData),
                datasets: [
                  {
                    label: 'Amount ($)',
                    data: Object.values(categorizedData),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Expense Category Breakdown',
                  },
                },
              }}
            />
          </div>
        )}


      </div>
    </div>
  );
};

export default Home;
