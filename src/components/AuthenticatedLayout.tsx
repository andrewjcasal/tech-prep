import { useState } from "react";
import { User, LogOut, Settings } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Layout from "./Layout";
import "./AuthenticatedLayout.css";

export default function AuthenticatedLayout() {
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  return (
    <div className="authenticated-layout">
      <div className="auth-header">
        <div className="auth-header-content">
          <div className="app-title">
            <h1>Tech Interview Prep</h1>
          </div>

          <div className="user-section">
            <div className="user-info">
              <span className="user-email">{user?.email}</span>
            </div>

            <div className="user-menu-container">
              <button
                className="user-menu-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <User size={20} />
              </button>

              {showUserMenu && (
                <div className="user-menu">
                  <div className="user-menu-header">
                    <div className="user-avatar">
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <div className="user-name">
                        {user?.user_metadata?.full_name ||
                          user?.email?.split("@")[0]}
                      </div>
                      <div className="user-email-small">{user?.email}</div>
                    </div>
                  </div>

                  <div className="user-menu-divider"></div>

                  <div className="user-menu-items">
                    <button className="user-menu-item">
                      <Settings size={16} />
                      Settings
                    </button>
                    <button className="user-menu-item" onClick={handleSignOut}>
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="auth-content">
        <Layout />
      </div>

      {showUserMenu && (
        <div
          className="user-menu-overlay"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
}
