import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

interface PostAuthHandlerProps {
  selectedPlan: "weekly" | "monthly";
  onError: (error: string) => void;
}

export default function PostAuthHandler({
  selectedPlan,
  onError,
}: PostAuthHandlerProps) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user && !isProcessing) {
      handleStripeCheckout();
    }
  }, [user, isProcessing]);

  const handleStripeCheckout = async () => {
    if (!user) return;

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: { plan: selectedPlan },
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      onError("Failed to create checkout session. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="post-auth-handler">
      <div className="processing-message">
        <div className="loading-spinner"></div>
        <h3>Setting up your {selectedPlan} subscription...</h3>
        <p>You'll be redirected to complete your payment in just a moment.</p>
      </div>
    </div>
  );
}
