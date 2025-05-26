import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import "./App.css";

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
