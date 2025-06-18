import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  useParams,
  Navigate,
} from "react-router-dom";
import { useState } from "react";
import {
  FileText,
  List,
  Target,
  Code,
  LogOut,
  Settings,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import ProblemsList from "./ProblemsList";
import InterviewTypes from "./InterviewTypes";
import AIInterviewer from "./AIInterviewer";
import LeetCodePrep from "./LeetCodePrep";
import Networking from "./Networking";
import "./Layout.css";

// Wrapper component to pass problemId from URL params to AIInterviewer
function AIInterviewerWrapper({ onBack }: { onBack: () => void }) {
  const { problemId } = useParams<{ problemId: string }>();

  if (!problemId) {
    return <div>Problem not found</div>;
  }

  return <AIInterviewer problemId={problemId} onBack={onBack} />;
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleProblemClick = (problemId: string) => {
    navigate(`/interview/${problemId}`);
  };

  const handleBackToProblems = () => {
    navigate("/problems");
  };

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Tech Interview Prep</h2>
        </div>
        <nav className="sidebar-nav">
          {false && (
            <button
              className={`nav-item ${isActive("/") ? "active" : ""}`}
              onClick={() => navigate("/")}
            >
              <FileText className="nav-icon sm:mr-4" size={20} />
              <span className="sm:block hidden">Interview Prep</span>
            </button>
          )}
          <button
            className={`nav-item ${isActive("/problems") ? "active" : ""}`}
            onClick={() => navigate("/problems")}
          >
            <List className="nav-icon sm:mr-4" size={20} />
            <span className="sm:block hidden">Problems List</span>
          </button>
          <button
            className={`nav-item ${
              isActive("/interview-types") ? "active" : ""
            }`}
            onClick={() => navigate("/interview-types")}
          >
            <Target className="nav-icon sm:mr-4" size={20} />
            <span className="sm:block hidden">Interview Types</span>
          </button>
          <button
            className={`nav-item ${isActive("/leetcode") ? "active" : ""}`}
            onClick={() => navigate("/leetcode")}
          >
            <Code className="nav-icon sm:mr-4" size={20} />
            <span className="sm:block hidden">LeetCode Prep</span>
          </button>
          {false && (
            <button
              className={`nav-item ${isActive("/networking") ? "active" : ""}`}
              onClick={() => navigate("/networking")}
            >
              <Users className="nav-icon sm:mr-4" size={20} />
              <span className="sm:block hidden">Networking</span>
            </button>
          )}
        </nav>

        <div className="sidebar-user-section">
          <div className="sidebar-user-info">
            <div className="sidebar-user-avatar">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-details">
              <div className="sidebar-user-name">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
              </div>
              <div className="sidebar-user-email">{user?.email}</div>
            </div>
          </div>

          <div className="sidebar-user-menu-container">
            <button
              className="sidebar-user-menu-button hidden sm:block p-1.5"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <SlidersHorizontal size={20} />
            </button>

            {showUserMenu && (
              <div className="sidebar-user-menu">
                {false && (
                  <button className="sidebar-user-menu-item">
                    <Settings size={16} />
                    Settings
                  </button>
                )}
                <button
                  className="sidebar-user-menu-item"
                  onClick={handleSignOut}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
      <main className="main-container">
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/problems" />} />
            <Route
              path="/problems"
              element={<ProblemsList onProblemClick={handleProblemClick} />}
            />
            <Route path="/interview-types" element={<InterviewTypes />} />
            <Route path="/leetcode" element={<LeetCodePrep />} />
            <Route path="/networking/*" element={<Networking />} />
            <Route
              path="/interview/:problemId"
              element={<AIInterviewerWrapper onBack={handleBackToProblems} />}
            />
          </Routes>
        </div>
      </main>

      {showUserMenu && (
        <div
          className="sidebar-user-menu-overlay"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
}
