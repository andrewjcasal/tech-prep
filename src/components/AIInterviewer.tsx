import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
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
}

interface AIInterviewerProps {
  problemId: string;
  onBack: () => void;
}

export default function AIInterviewer({
  problemId,
  onBack,
}: AIInterviewerProps) {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProblem, setIsLoadingProblem] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProblemAndMessages();
  }, [problemId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchProblemAndMessages = async () => {
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
      } else {
        // Start conversation with AI introduction
        await startConversation(problemData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load problem");
    } finally {
      setIsLoadingProblem(false);
    }
  };

  const startConversation = async (problemData: Problem) => {
    const initialPrompt = `You are an experienced technical interviewer conducting a ${problemData.interview_types.type} interview. 

The candidate will be working on this problem:
Title: ${problemData.title}
Description: ${problemData.description}
Difficulty: ${problemData.difficulty}

Your role:
1. Start by greeting the candidate and briefly explaining the problem
2. Ask clarifying questions to understand their approach
3. Guide them through their solution step by step
4. Provide hints if they get stuck, but don't give away the answer
5. Ask follow-up questions about edge cases, optimization, or alternative approaches
6. Be encouraging but thorough in your evaluation
7. Keep responses concise and focused

Begin the interview now.`;

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
      });

      setMessages((prev) => [...prev, aiMessage]);
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
          <h2>Loading interview...</h2>
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

  return (
    <div className="ai-interviewer-container">
      <div className="interview-header">
        <button onClick={onBack} className="back-button">
          <ArrowLeft size={20} />
          Back to Problems
        </button>
        <div className="problem-info">
          <h1>{problem.title}</h1>
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
                  Thinking...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your response..."
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
