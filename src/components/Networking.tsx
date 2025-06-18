import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Building2, Users } from "lucide-react";
import Companies from "./Companies";
import Contacts from "./Contacts";
import "./Networking.css";

export default function Networking() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/networking" && location.pathname === "/networking")
      return true;
    if (path !== "/networking" && location.pathname.startsWith(path))
      return true;
    return false;
  };

  return (
    <div className="networking-container">
      <div className="networking-header">
        <h1>Networking</h1>
        <p>Track your job applications and networking contacts</p>
      </div>

      <div className="networking-content">
        <nav className="networking-nav">
          <button
            className={`networking-nav-item ${
              isActive("/networking/companies") ? "active" : ""
            }`}
            onClick={() => navigate("/networking/companies")}
          >
            <Building2 className="nav-icon" size={20} />
            Companies
          </button>
          <button
            className={`networking-nav-item ${
              isActive("/networking/contacts") ? "active" : ""
            }`}
            onClick={() => navigate("/networking/contacts")}
          >
            <Users className="nav-icon" size={20} />
            Contacts
          </button>
        </nav>

        <div className="networking-main">
          <Routes>
            <Route path="/" element={<Companies />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/contacts" element={<Contacts />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
