import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import "./AIInterviewer.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  interview_types: {
    type: string;
  };
  completed: boolean;
}

interface AIInterviewerProps {
  problemId: string;
  onBack: () => void;
}

export default function AIInterviewer({
  problemId,
  onBack,
}: AIInterviewerProps) {
  const { user } = useAuth();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProblem, setIsLoadingProblem] = useState(true);
  const [error, setError] = useState("");
  const [canEndInterview, setCanEndInterview] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if we should show feedback view
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("feedback") === "true") {
      setShowFeedback(true);
      fetchFeedbackData();
    }
  }, [problemId]);

  useEffect(() => {
    // Reset initialization flag and fetch data when problemId changes
    setHasInitialized(false);
    setMessages([]);
    setError("");
    fetchProblemAndMessages();
  }, [problemId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchProblemAndMessages = async () => {
    // Prevent duplicate initialization
    if (hasInitialized) return;

    try {
      setIsLoadingProblem(true);

      // Fetch problem details
      const { data: problemData, error: problemError } = await supabase
        .from("problems")
        .select(
          `
          *,
          interview_types (type)
        `
        )
        .eq("id", problemId)
        .single();

      if (problemError) throw problemError;
      setProblem(problemData);

      // Fetch existing messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("problem_id", problemId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      if (messagesData && messagesData.length > 0) {
        setMessages(messagesData);

        // Check if the last message was from the user and we need to welcome them back
        const lastMessage = messagesData[messagesData.length - 1];
        const timeSinceLastMessage =
          new Date().getTime() - new Date(lastMessage.created_at).getTime();
        const hoursAgo = timeSinceLastMessage / (1000 * 60 * 60);

        // Only send welcome back if it's been more than 30 minutes, last message was from user,
        // and the last message isn't already a welcome back from the assistant
        const shouldSendWelcomeBack =
          hoursAgo > 0.5 &&
          lastMessage.role === "user" &&
          !lastMessage.content.toLowerCase().includes("welcome back") &&
          !messagesData.some(
            (msg) =>
              msg.role === "assistant" &&
              msg.content.toLowerCase().includes("welcome back") &&
              new Date().getTime() - new Date(msg.created_at).getTime() <
                1000 * 60 * 60 // within last hour
          );

        if (shouldSendWelcomeBack) {
          await sendWelcomeBackMessage(problemData, messagesData);
        }
      } else {
        // Start conversation with AI introduction
        await startConversation(problemData);
      }

      // Mark as initialized to prevent duplicate calls
      setHasInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load problem");
    } finally {
      setIsLoadingProblem(false);
    }
  };

  const sendWelcomeBackMessage = async (
    problemData: Problem,
    existingMessages?: Message[]
  ) => {
    const welcomeBackPrompt = `The user has returned to this ${problemData.interview_types.type} interview session after some time away. 

PROBLEM CONTEXT (don't repeat this to the user - they can see it):
Title: ${problemData.title}
Description: ${problemData.description}
Difficulty: ${problemData.difficulty}

INSTRUCTIONS:
- Send a brief, warm welcome back message
- Reference that you're ready to continue where you left off
- Don't repeat the problem details
- Ask them if they want to continue from where they left off or if they have any questions
- Keep it short and encouraging

Send a welcome back message now.`;

    try {
      // Get the current conversation history
      const messagesToUse = existingMessages || messages;
      const conversationHistory = messagesToUse.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add the welcome back prompt as a system message
      const messagesWithPrompt = [
        { role: "system" as const, content: welcomeBackPrompt },
        ...conversationHistory,
      ];

      const { data, error } = await supabase.functions.invoke(
        "ai-interviewer",
        {
          body: {
            messages: messagesWithPrompt,
            problemId: problemId,
          },
        }
      );

      if (error) throw error;

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        created_at: new Date().toISOString(),
      };

      // Save AI message to database
      await supabase.from("messages").insert({
        problem_id: problemId,
        role: "assistant",
        content: data.response,
        user_id: user?.id,
      });

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Failed to send welcome back message:", err);
    }
  };

  const startConversation = async (problemData: Problem) => {
    const initialPrompt = `You are conducting a ${problemData.interview_types.type} interview for this problem:

PROBLEM CONTEXT (don't repeat this to the user - they can see it):
Title: ${problemData.title}
Description: ${problemData.description}
Difficulty: ${problemData.difficulty}

INSTRUCTIONS:
- The user can already see the problem details above, so don't repeat them unless adding clarity
- Start with a warm, encouraging greeting
- Ask them to share their initial thoughts on the problem
- Be collaborative and supportive throughout
- At any time, if the user asks for feedback on "how they're doing" or wants a "pulse check", provide encouraging, constructive feedback on their approach so far
- Focus on their thought process and reasoning
- Keep responses conversational and encouraging

Begin the interview with a welcoming message that doesn't repeat the problem details.`;

    try {
      const { data, error } = await supabase.functions.invoke(
        "ai-interviewer",
        {
          body: {
            messages: [{ role: "system", content: initialPrompt }],
            problemId: problemId,
          },
        }
      );

      if (error) throw error;

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        created_at: new Date().toISOString(),
      };

      // Save AI message to database
      await supabase.from("messages").insert({
        problem_id: problemId,
        role: "assistant",
        content: data.response,
        user_id: user?.id,
      });

      setMessages([aiMessage]);
    } catch (err) {
      setError("Failed to start conversation");
      console.error(err);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: currentMessage,
      created_at: new Date().toISOString(),
    };

    // Add user message to state immediately
    setMessages((prev) => [...prev, userMessage]);
    setCurrentMessage("");
    setIsLoading(true);

    try {
      // Save user message to database
      await supabase.from("messages").insert({
        problem_id: problemId,
        role: "user",
        content: currentMessage,
        user_id: user?.id,
      });

      // Prepare conversation history for AI
      const conversationHistory = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Get AI response
      const { data, error } = await supabase.functions.invoke(
        "ai-interviewer",
        {
          body: {
            messages: conversationHistory,
            problemId: problemId,
          },
        }
      );

      if (error) throw error;

      // Check if the response contains evaluation data
      let responseContent = data.response;
      let evaluationData = null;

      try {
        // Look for JSON at the end of the response
        const jsonMatch = responseContent.match(
          /\{[^}]*"canEndInterview"[^}]*\}/
        );
        if (jsonMatch) {
          evaluationData = JSON.parse(jsonMatch[0]);
          // Remove the JSON from the display content
          responseContent = responseContent.replace(jsonMatch[0], "").trim();
        }
      } catch (e) {
        // If JSON parsing fails, just continue without evaluation
      }

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: responseContent,
        created_at: new Date().toISOString(),
      };

      // Save AI message to database
      await supabase.from("messages").insert({
        problem_id: problemId,
        role: "assistant",
        content: responseContent,
        user_id: user?.id,
      });

      setMessages((prev) => [...prev, aiMessage]);

      // Update evaluation state
      if (evaluationData?.canEndInterview) {
        setCanEndInterview(true);
        // Mark problem as completed
        await markProblemCompleted();
      }
    } catch (err) {
      setError("Failed to send message");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const markProblemCompleted = async () => {
    try {
      const { error } = await supabase
        .from("problems")
        .update({ completed: true })
        .eq("id", problemId)
        .eq("user_id", user?.id);

      if (error) {
        console.error("Failed to mark problem as completed:", error);
      } else {
        console.log("Problem marked as completed");
      }
    } catch (err) {
      console.error("Error marking problem as completed:", err);
    }
  };

  const fetchFeedbackData = async () => {
    try {
      // Fetch competency history for this problem with tech topics
      const { data: historyData, error: historyError } = await supabase
        .from("competency_history")
        .select(
          `
          *,
          competencies (
            name,
            description
          ),
          competency_history_tech_topics (
            tech_topics (
              id,
              name,
              description
            )
          )
        `
        )
        .eq("problem_id", problemId)
        .order("created_at", { ascending: false });

      if (historyError) throw historyError;

      setFeedbackData(historyData);
    } catch (err) {
      console.error("Failed to fetch feedback data:", err);
      setError("Failed to load feedback data");
    }
  };

  const handleEndInterview = async () => {
    if (!problem) return;

    setIsEvaluating(true);

    try {
      // Prepare messages for evaluation
      const evaluationMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const { error } = await supabase.functions.invoke("evaluate-interview", {
        body: {
          problemId: problemId,
          messages: evaluationMessages,
        },
      });

      if (error) throw error;

      // Show success message and go back to problems
      alert(
        `Interview completed! Your competencies have been updated based on your performance.`
      );
      onBack();
    } catch (err) {
      console.error("Failed to evaluate interview:", err);
      alert("Failed to evaluate interview. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "#28a745";
      case "Medium":
        return "#ffc107";
      case "Hard":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  if (isLoadingProblem) {
    return (
      <div className="ai-interviewer-container">
        <div className="loading-state">
          <Loader2 className="loading-spinner" size={32} />
          <h2>Setting up your interview session...</h2>
          <p>Getting everything ready for a great conversation! 🚀</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-interviewer-container">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={onBack} className="back-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="ai-interviewer-container">
        <div className="error-message">
          <h3>Problem not found</h3>
          <button onClick={onBack} className="back-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Show feedback view if requested
  if (showFeedback) {
    return (
      <div className="ai-interviewer-container">
        <div className="interview-header">
          <button onClick={onBack} className="back-button link">
            <ArrowLeft size={20} />
            Back to Problems
          </button>
          <div className="problem-info">
            <h1>Feedback: {problem.title}</h1>
            <div className="problem-meta">
              <span className="interview-type">
                {problem.interview_types.type}
              </span>
              <span
                className="difficulty-badge"
                style={{
                  backgroundColor: getDifficultyColor(problem.difficulty),
                }}
              >
                {problem.difficulty}
              </span>
            </div>
          </div>
        </div>

        <div className="feedback-container">
          {feedbackData && feedbackData.length > 0 ? (
            <div className="feedback-content">
              <h2>Your Performance Evaluation</h2>
              <p className="feedback-intro">
                Here's how you performed in this interview session:
              </p>

              {feedbackData.map((item: any, index: number) => (
                <div key={index} className="competency-feedback">
                  <h3>{item.competencies.name}</h3>
                  <p className="competency-description">
                    {item.competencies.description}
                  </p>

                  <div className="progress-change">
                    <span className="progress-label">Progress:</span>
                    <span className="progress-values">
                      {item.progress_before}% → {item.progress_after}%
                    </span>
                    {item.progress_after > item.progress_before && (
                      <span className="improvement-indicator">
                        +{item.progress_after - item.progress_before}%
                      </span>
                    )}
                  </div>

                  <div className="feedback-section">
                    <h4>What you did well:</h4>
                    <p className="strengths">{item.strengths_notes}</p>
                  </div>

                  <div className="feedback-section">
                    <h4>Areas for improvement:</h4>
                    <p className="improvements">{item.improvement_notes}</p>

                    {/* Display tech topics if available */}
                    {item.competency_history_tech_topics &&
                      item.competency_history_tech_topics.length > 0 && (
                        <div className="tech-topics-section">
                          <h5>Related Tech Topics to Study:</h5>
                          <div className="tech-topics-grid">
                            {item.competency_history_tech_topics.map(
                              (topicLink: any, topicIndex: number) => (
                                <div
                                  key={topicIndex}
                                  className="tech-topic-card"
                                >
                                  <h6>{topicLink.tech_topics.name}</h6>
                                  {topicLink.tech_topics.description && (
                                    <p className="tech-topic-description">
                                      {topicLink.tech_topics.description}
                                    </p>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-feedback">
              <h2>No feedback available</h2>
              <p>
                Complete an interview session to see your performance
                evaluation.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="ai-interviewer-container">
      <div className="interview-header">
        <button onClick={onBack} className="back-button">
          <ArrowLeft size={20} />
          Back to Problems
        </button>
        <div className="problem-info">
          <h1>{problem.title}</h1>
          <div className="problem-meta mb-2">
            <span className="interview-type mr-2">
              {problem.interview_types.type}
            </span>
            <span
              className="difficulty-badge px-2 py-1"
              style={{
                backgroundColor: getDifficultyColor(problem.difficulty),
              }}
            >
              {problem.difficulty}
            </span>
          </div>
          <p className="problem-description">{problem.description}</p>
        </div>
      </div>

      <div className="chat-container">
        <div className="messages-container">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-role">
                    {message.role === "assistant" ? "AI Interviewer" : "You"}
                  </span>
                  <span className="message-time">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-text">{message.content}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="message-header">
                  <span className="message-role">AI Interviewer</span>
                </div>
                <div className="message-text">
                  <Loader2 className="loading-spinner" size={16} />
                  Thinking through your response... 🤔
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {canEndInterview ||
          (problem.completed && (
            <div className="end-interview-container">
              <button
                onClick={handleEndInterview}
                disabled={isEvaluating}
                className="end-interview-button"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="loading-spinner" size={16} />
                    Evaluating Performance...
                  </>
                ) : (
                  "End Problem & Get Feedback"
                )}
              </button>
              <p className="end-interview-note">
                Ready to wrap up? Click to get your competency evaluation!
              </p>
            </div>
          ))}

        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share your thoughts, ask questions, or work through your solution... You can also ask 'How am I doing?' for feedback anytime! 💭"
              rows={3}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!currentMessage.trim() || isLoading}
              className="send-button"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
