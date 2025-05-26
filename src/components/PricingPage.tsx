import { Check, ArrowLeft } from "lucide-react";
import "./PricingPage.css";

interface PricingPageProps {
  onBack: () => void;
  onSignUp: (plan?: "free" | "weekly" | "monthly") => void;
}

export default function PricingPage({ onBack, onSignUp }: PricingPageProps) {
  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <button onClick={onBack} className="back-button">
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="pricing-title">
          <h1>Choose Your Plan</h1>
          <p>
            Start with a free trial, then upgrade to unlock unlimited practice
          </p>
        </div>
      </div>

      <div className="pricing-container">
        <div className="pricing-plans">
          {/* Free Trial Plan */}
          <div className="pricing-plan free">
            <div className="plan-header">
              <h3>Free Trial</h3>
              <div className="plan-price">
                <span className="price">$0</span>
                <span className="period">1 practice problem</span>
              </div>
            </div>
            <div className="plan-features">
              <ul>
                <li>
                  <Check size={16} /> 1 AI-generated practice problem
                </li>
                <li>
                  <Check size={16} /> AI interviewer session
                </li>
                <li>
                  <Check size={16} /> Basic competency tracking
                </li>
                <li>
                  <Check size={16} /> Performance feedback
                </li>
              </ul>
            </div>
            <button
              className="plan-button primary"
              onClick={() => onSignUp("free")}
            >
              Start Free Trial
            </button>
          </div>

          {/* Weekly Plan */}
          <div className="pricing-plan weekly popular">
            <div className="plan-badge">Most Popular</div>
            <div className="plan-header">
              <h3>Weekly</h3>
              <div className="plan-price">
                <span className="price">$5</span>
                <span className="period">per week</span>
              </div>
            </div>
            <div className="plan-features">
              <ul>
                <li>
                  <Check size={16} /> Unlimited practice problems
                </li>
                <li>
                  <Check size={16} /> AI interviewer sessions
                </li>
                <li>
                  <Check size={16} /> Advanced competency tracking
                </li>
                <li>
                  <Check size={16} /> Detailed performance analytics
                </li>
                <li>
                  <Check size={16} /> Job-specific problem generation
                </li>
                <li>
                  <Check size={16} /> Progress history
                </li>
                <li>
                  <Check size={16} /> Multiple interview types
                </li>
              </ul>
            </div>
            <button
              className="plan-button primary"
              onClick={() => onSignUp("weekly")}
            >
              Sign Up for Weekly
            </button>
          </div>

          {/* Monthly Plan */}
          <div className="pricing-plan monthly">
            <div className="plan-header">
              <h3>Monthly</h3>
              <div className="plan-price">
                <span className="price">$15</span>
                <span className="period">per month</span>
              </div>
              <div className="plan-savings">Save 25%</div>
            </div>
            <div className="plan-features">
              <ul>
                <li>
                  <Check size={16} /> Everything in Weekly
                </li>
                <li>
                  <Check size={16} /> Priority AI responses
                </li>
                <li>
                  <Check size={16} /> Custom competency creation
                </li>
                <li>
                  <Check size={16} /> Export progress reports
                </li>
                <li>
                  <Check size={16} /> Email support
                </li>
                <li>
                  <Check size={16} /> Advanced analytics dashboard
                </li>
              </ul>
            </div>
            <button
              className="plan-button primary"
              onClick={() => onSignUp("monthly")}
            >
              Sign Up for Monthly
            </button>
          </div>
        </div>

        <div className="pricing-faq">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>Can I cancel anytime?</h4>
              <p>
                Yes, you can cancel your subscription at any time. Your access
                will continue until the end of your current billing period.
              </p>
            </div>
            <div className="faq-item">
              <h4>What happens after my free trial?</h4>
              <p>
                After your free trial, you can choose to upgrade to a paid plan
                or continue with limited access to the platform.
              </p>
            </div>
            <div className="faq-item">
              <h4>Do you offer refunds?</h4>
              <p>
                We offer a 7-day money-back guarantee for all paid plans.
                Contact support if you're not satisfied.
              </p>
            </div>
            <div className="faq-item">
              <h4>Can I switch between plans?</h4>
              <p>
                Yes, you can upgrade or downgrade your plan at any time. Changes
                will be prorated and reflected in your next billing cycle.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
