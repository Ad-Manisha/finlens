import React, { useState, useEffect } from 'react';
import { FaHome, FaWallet, FaQuestionCircle, FaPlus, FaChartLine, FaUser } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './Home.css';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CategoryCard from './CategoryCard';


ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Home = () => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [file, setFile] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [categorizedData, setCategorizedData] = useState({});
  const [uncategorized, setUncategorized] = useState([]);
  const [isBudgetFormVisible, setIsBudgetFormVisible] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [category, setCategory] = useState('');
  const [month, setMonth] = useState('');
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [lineItems, setLineItems] = useState([]);


  const authUser = localStorage.getItem('user');
  const parsedUser = authUser ? JSON.parse(authUser) : null;

  const [error, setError] = useState('');

  // ✅ Define fetchBudgetAlerts outside useEffect
  const fetchBudgetAlerts = async () => {
    const userId = parsedUser?.user?.id;
    if (!userId) return;

    const currentMonth = new Date().toISOString().slice(0, 7);
    try {
      const alertRes = await fetch(`http://localhost:8000/budget/alerts/${userId}?month=${currentMonth}`);
      const alertData = await alertRes.json(); // Rename this to avoid confusion

      if (alertRes.ok && alertData.alerts.length > 0) {
        setBudgetAlerts(alertData.alerts); // use alerts key from response
        alertData.alerts.forEach(alert => {
          toast.warn(
            `${alert.category} ${alert.status === "EXCEEDED" ? "exceeded" : "near limit"}: spent Rs.${alert.spent} of Rs.${alert.budget}`,
            { autoClose: 5000 }
          );
        });
      } else {
        setBudgetAlerts([]);
      }


    } catch (err) {
      console.error("Alert fetch error:", err);
    }
  };


  // Call it on first load
  useEffect(() => {
    fetchBudgetAlerts();
  }, []);



  const categorizeText = async (text) => {
    const userId = parsedUser?.user?.id;

    if (!userId) {
      console.error("User ID is missing");
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/categorize-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, text: text })
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Full Categorization API result:", JSON.stringify(result, null, 2));
        setCategorizedData(result.categorized);

        if (!result.categorized || Object.keys(result.categorized).length === 0) {
          toast.info("No categorized data returned.");
        }

        setUncategorized(result.uncategorized_lines);
        setLineItems(result.line_items);
        toast.success("Categorized successfully!");

        await fetchBudgetAlerts(); // ✅ refresh alerts
      } else {
        console.error("Backend error:", result);
        toast.error("Categorization failed.");
      }
    } catch (error) {
      console.error("Error during categorization:", error);
      toast.error("Error during categorization.");
    }
  };


  const handleInputChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please Select an image.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/upload-receipt', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setOcrText(result.text);
        toast.success("Text extracted successfully!");
        categorizeText(result.text);
        setError('');
        setIsFormVisible(false);
        setFile(null);
      } else {
        setError(result.detail || result.message || "Failed to extract text.");
        toast.error(result.detail || result.message || "Failed to extract text.");
      }
    } catch (error) {
      setError("Error: " + error.message);
      toast.error("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      <div className="home-container">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="profile-section">
            <FaUser /> {parsedUser?.user?.name || "Guest"}
          </div>
          <ul className="sidebar-links">
            <li><Link to="/"><FaHome /> Home</Link></li>
            <li><Link to="*"><FaWallet /> Expenses</Link></li>
            <li><Link to="*"><FaQuestionCircle /> Support</Link></li>
          </ul>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <div className="content-boxes">
            {/* Recent Expenses */}
            {/* Recent Expenses */}
            <div className="box recent-expenses">
              <h3>Recent Expenses</h3>
              <table className="expense-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {categorizedData && Object.keys(categorizedData).length > 0 ? (
                    Object.entries(categorizedData).map(([category, total]) => (
                      <tr key={category}>
                        <td>{category}</td>
                        <td>Rs.{parseFloat(total).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" style={{ textAlign: 'center' }}>No expenses yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>


            {/* Display Alerts */}
            {budgetAlerts.length > 0 && (
              <div className="box budget-alerts">
                <h3>⚠️ Budget Alerts</h3>
                <ul>
                  {budgetAlerts.map((alert, index) => (
                    <li key={index} style={{ color: alert.status === "EXCEEDED" ? 'red' : 'orange', fontWeight: 'bold' }}>
                      {alert.category}: {alert.status === "EXCEEDED" ? "Exceeded" : "Near Limit"} – Spent Rs.{alert.spent} of Rs.{alert.budget}
                    </li>
                  ))}
                </ul>
              </div>
            )}



            {categorizedData && Object.keys(categorizedData).length > 0 && (
              <div className="box">
                <h4>Categorized Totals:</h4>
                <table className="expense-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(categorizedData).map(([category, total]) => (
                      <tr key={category}>
                        <td>{category}</td>
                        <td>Rs.{total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="category-card-container">
                  {Object.entries(categorizedData).map(([cat, amt]) => (
                    <CategoryCard key={cat} name={cat} amount={amt} />
                  ))}
                </div>
              </div>
            )}

            {/* Quick Access */}
            <div className="box quick-access">
              <h3>Quick Access</h3>
              <div className="quick-access-buttons">
                <button className="orange" onClick={() => setIsFormVisible(true)}><FaPlus /> Add Receipt</button>
                <button className="orange"><FaChartLine /> Create Report</button>
                <button className="orange" onClick={() => {
                  console.log("Clicked Set Budget");
                  setIsBudgetFormVisible(true);
                }}>
                  Set Budget
                </button>
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
                  <button className="orange" disabled={isLoading}>
                    {isLoading ? "Submitting..." : "Submit"}
                  </button>

                  <button className="btn btn-danger btn-sm ms-2" type="button" onClick={() => setIsFormVisible(false)}>Cancel</button>
                </div>
              </form>

              {isLoading && (
                <div className="loading-message">
                  <div className="spinner"></div>
                  <p>Processing image and categorizing...</p>
                </div>
              )}

              {ocrText && (
                <div className="box">
                  <h4>Extracted Text:</h4>
                  <pre>{ocrText}</pre>
                </div>
              )}

              {lineItems.length > 0 && (
                <div className="box">
                  <h4>Detailed Line Items:</h4>
                  <table className="expense-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Amount (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, index) => (
                        <tr key={index}>
                          <td>{item.description}</td>
                          <td>{item.category}</td>
                          <td>Rs.{item.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}


              {uncategorized.length > 0 && (
                <div className="box">
                  <h4>Uncategorized Items:</h4>
                  <ul>
                    {uncategorized.map((line, index) => (
                      <li key={index}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

          {isBudgetFormVisible && (
            <div className="box budget-form">
              <h3>Set Budget</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const userId = parsedUser?.user?.id;
                if (!userId) return toast.error("User not found");

                const payload = {
                  user_id: userId,
                  category,
                  amount: parseFloat(budgetAmount),
                  month
                };

                try {
                  const response = await fetch('http://localhost:8000/budget/set', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });

                  const result = await response.json();

                  if (response.ok) {
                    toast.success("Budget set successfully!");
                    setIsBudgetFormVisible(false);
                    setBudgetAmount('');
                    setCategory('');
                    setMonth('');
                    fetchBudgetAlerts();
                  } else {
                    toast.error(result.detail || result.message || "Failed to set budget.");
                  }
                } catch (error) {
                  toast.error("Error: " + error.message);
                }
              }}>
                <label>
                  Category:
                  <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                    <option value="">Select Category</option>
                    <option value="Food">Food</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Personal Care">Personal Care</option>
                    <option value="Health">Health</option>
                    <option value="Taxes">Taxes</option>
                    <option value="Other">Other</option>
                  </select>

                </label>

                <label>
                  Budget Amount: Rs.{budgetAmount}
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="5"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                  />
                </label>

                <label>
                  Month:
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    required
                  />
                </label>

                <button type="submit" className="orange">Set Budget</button>
                <button type="button" onClick={() => setIsBudgetFormVisible(false)}>Cancel</button>
              </form>
            </div>
          )}

          {/* Monthly Report */}
          {(!categorizedData || Object.keys(categorizedData).length === 0) && (
            <p style={{ textAlign: 'center', color: 'gray' }}>No chart data available</p>
          )}

          {categorizedData && typeof categorizedData === 'object' && Object.keys(categorizedData).length > 0 && (
            <div className="box">
              <h4>Expense Breakdown Chart:</h4>
              <Bar
                data={{
                  labels: Object.keys(categorizedData),
                  datasets: [
                    {
                      label: 'Amount (Rs.)',
                      data: Object.values(categorizedData),
                      backgroundColor: [
                        '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#6366f1', '#14b8a6'
                      ],
                      borderColor: 'rgba(75, 192, 192, 1)',
                      borderWidth: 1
                    }
                  ]
                }}
              />
            </div>
          )}
        </div>
      </div>

      <ToastContainer />

    </>
  );
};

export default Home;
