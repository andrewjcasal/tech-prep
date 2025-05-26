import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { FileText, List, Target } from "lucide-react";
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

  const handleProblemClick = (problemId: string) => {
    navigate(`/interview/${problemId}`);
  };

  const handleBackToProblems = () => {
    navigate("/problems");
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
          <h2>Tech Prep</h2>
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
      </aside>
      <main className="main-content">
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
    </div>
  );
}
