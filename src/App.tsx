import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthenticatedLayout from "./components/AuthenticatedLayout";
import LandingPage from "./components/LandingPage";
import PostAuthHandler from "./components/PostAuthHandler";
import "./App.css";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Check for plan parameter in URL (for post-auth flow)
  const urlParams = new URLSearchParams(window.location.search);
  const planParam = urlParams.get("plan") as "weekly" | "monthly" | null;

  if (!user) {
    return <LandingPage />;
  }

  // If user just authenticated and has a plan parameter, handle subscription
  if (planParam && (planParam === "weekly" || planParam === "monthly")) {
    return (
      <PostAuthHandler
        selectedPlan={planParam}
        onComplete={() => {
          // Remove plan parameter and redirect to app
          window.history.replaceState({}, "", "/");
        }}
        onError={(error) => {
          alert(error);
          // Remove plan parameter and redirect to app
          window.history.replaceState({}, "", "/");
        }}
      />
    );
  }

  return <AuthenticatedLayout />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
