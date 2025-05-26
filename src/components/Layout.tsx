import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { useState } from "react";
import {
  FileText,
  List,
  Target,
  User,
  LogOut,
  Settings,
  Settings2Icon,
  HamburgerIcon,
  Hamburger,
  LucideHamburger,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import InterviewPrep from "./InterviewPrep";
import ProblemsList from "./ProblemsList";
import InterviewTypes from "./InterviewTypes";
import AIInterviewer from "./AIInterviewer";
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
          <button
            className={`nav-item ${isActive("/") ? "active" : ""}`}
            onClick={() => navigate("/")}
          >
            <FileText className="nav-icon" size={20} />
            Interview Prep
          </button>
          <button
            className={`nav-item ${isActive("/problems") ? "active" : ""}`}
            onClick={() => navigate("/problems")}
          >
            <List className="nav-icon" size={20} />
            Problems List
          </button>
          <button
            className={`nav-item ${
              isActive("/interview-types") ? "active" : ""
            }`}
            onClick={() => navigate("/interview-types")}
          >
            <Target className="nav-icon" size={20} />
            Interview Types
          </button>
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
              className="sidebar-user-menu-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <SlidersHorizontal size={20} />
            </button>

            {showUserMenu && (
              <div className="sidebar-user-menu">
                <button className="sidebar-user-menu-item">
                  <Settings size={16} />
                  Settings
                </button>
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
      <main className="main-content p-4 md:p-8">
        <Routes>
          <Route path="/" element={<InterviewPrep />} />
          <Route
            path="/problems"
            element={<ProblemsList onProblemClick={handleProblemClick} />}
          />
          <Route path="/interview-types" element={<InterviewTypes />} />
          <Route
            path="/interview/:problemId"
            element={<AIInterviewerWrapper onBack={handleBackToProblems} />}
          />
        </Routes>
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
