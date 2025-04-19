import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'
// import Navbar from './components/NavBar'
import NavBar from './components/NavBar'
import Home from './components/Home'
import Login from './components/Login'
import Signup from './components/Signup'
import NotFound from "./components/NotFound";
import LandingPage from "./components/LandingPage";

function App() {

  return (
    <>
      <Router>
        {/* <Navbar/> */}
        <NavBar header="FinLens" color="bg-dark" />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  )
}

export default App

