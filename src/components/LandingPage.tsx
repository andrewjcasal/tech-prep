import { useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "../lib/supabase";
import "./LandingPage.css";

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="landing-container">
      <div className="landing-hero">
        <div className="hero-content">
          <h1 className="hero-title">Master Your Technical Interviews</h1>
          <p className="hero-subtitle">
            AI-powered interview preparation that adapts to your skills and
            helps you grow
          </p>

          <div className="hero-features">
            <div className="feature">
              <div className="feature-icon">🎯</div>
              <h3>Personalized Practice</h3>
              <p>
                Get interview problems tailored to specific job postings and
                your skill level
              </p>
            </div>

            <div className="feature">
              <div className="feature-icon">🤖</div>
              <h3>AI Interviewer</h3>
              <p>
                Practice with an encouraging AI that provides real-time feedback
                and guidance
              </p>
            </div>

            <div className="feature">
              <div className="feature-icon">📈</div>
              <h3>Track Progress</h3>
              <p>
                Monitor your competency growth across different interview types
                and skills
              </p>
            </div>
          </div>

          <div className="hero-actions">
            <button
              className="cta-button primary"
              onClick={() => setShowAuth(true)}
            >
              Get Started Free
            </button>
            <button
              className="cta-button secondary"
              onClick={() => setShowAuth(true)}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      {showAuth && (
        <div className="auth-modal">
          <div className="auth-modal-content">
            <div className="auth-header">
              <h2>Welcome to Tech Interview Prep</h2>
              <button
                className="close-button"
                onClick={() => setShowAuth(false)}
              >
                ×
              </button>
            </div>

            <div className="auth-form">
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: "#007bff",
                        brandAccent: "#0056b3",
                      },
                    },
                  },
                }}
                providers={["google", "github"]}
                redirectTo={window.location.origin}
              />
            </div>
          </div>
        </div>
      )}

      <div className="landing-details">
        <div className="details-content">
          <h2>How It Works</h2>

          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Upload Job Posting</h3>
                <p>
                  Paste a job description and let our AI analyze the
                  requirements
                </p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Generate Problems</h3>
                <p>
                  Get customized interview problems based on the role and
                  company
                </p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Practice & Improve</h3>
                <p>
                  Work through problems with AI guidance and track your progress
                </p>
              </div>
            </div>
          </div>

          <div className="benefits">
            <h3>Why Choose Our Platform?</h3>
            <ul>
              <li>✅ Role-specific interview preparation</li>
              <li>✅ Real-time AI feedback and encouragement</li>
              <li>✅ Comprehensive competency tracking</li>
              <li>
                ✅ Multiple interview types (System Design, API Design, Coding,
                Behavioral)
              </li>
              <li>✅ Progress history and detailed analytics</li>
              <li>✅ Free to get started</li>
            </ul>
          </div>
        </div>
      </div>

      <footer className="landing-footer">
        <div className="footer-content">
          <p>&copy; 2024 Tech Interview Prep. Built with ❤️ for developers.</p>
        </div>
      </footer>
    </div>
  );
}
