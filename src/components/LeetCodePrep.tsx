import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, CheckCircle, Star, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import "./LeetCodePrep.css";

interface LeetCodeProblem {
  id: number;
  name: string;
  difficulty: "easy" | "medium" | "hard";
  category_id: string;
  created_at: string;
  leetcode_categories: {
    name: string;
  };
}

interface LeetCodeAttempt {
  id: string;
  problem_id: number;
  user_id: string;
  status: "completed" | "mastered" | "incorrect";
  next_review_date: string;
  created_at: string;
}

export default function LeetCodePrep() {
  const { user } = useAuth();
  const [problems, setProblems] = useState<LeetCodeProblem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<LeetCodeProblem | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Timer state
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Queue state
  const [queue, setQueue] = useState<LeetCodeProblem[]>([]);
  const [attempts, setAttempts] = useState<LeetCodeAttempt[]>([]);

  useEffect(() => {
    fetchProblems();
    fetchAttempts();
  }, []);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning]);

  const fetchProblems = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("leetcode_problems")
        .select(
          `
          *,
          leetcode_categories (
            name
          )
        `
        )
        .eq("difficulty", "easy")
        .order("created_at", { ascending: true });

      if (error) throw error;

      setProblems(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch problems");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from("leetcode_attempts")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;

      setAttempts(data || []);
    } catch (err) {
      console.error("Failed to fetch attempts:", err);
    }
  };

  useEffect(() => {
    if (problems.length > 0 && attempts.length >= 0) {
      updateQueue();
    }
  }, [problems, attempts]);

  const updateQueue = () => {
    const now = new Date();

    // Get problems that are due for review or haven't been attempted
    const dueProblems = problems.filter((problem) => {
      const attempt = attempts.find((a) => a.problem_id === problem.id);

      if (!attempt) {
        // Never attempted - add to queue
        return true;
      }

      // Check if it's due for review (must be in the past or today)
      const nextReviewDate = new Date(attempt.next_review_date);
      return nextReviewDate <= now;
    });

    setQueue(dueProblems);

    // If current problem is no longer in queue (was completed/mastered), move to next
    if (
      currentProblem &&
      !dueProblems.find((p) => p.id === currentProblem.id)
    ) {
      if (dueProblems.length > 0) {
        setCurrentProblem(dueProblems[0]);
      } else {
        setCurrentProblem(null);
      }
    }
    // Set current problem to first in queue if none selected
    else if (!currentProblem && dueProblems.length > 0) {
      setCurrentProblem(dueProblems[0]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const startTimer = () => {
    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeElapsed(0);
  };

  const getNextReviewDate = (
    status: "completed" | "mastered" | "incorrect"
  ) => {
    const now = new Date();
    if (status === "completed") {
      // Schedule for 3 days from now
      now.setDate(now.getDate() + 3);
    } else if (status === "mastered") {
      // Schedule for 1 week from now
      now.setDate(now.getDate() + 7);
    } else if (status === "incorrect") {
      // Schedule for tomorrow
      now.setDate(now.getDate() + 1);
    }
    return now.toISOString();
  };

  const handleComplete = async (
    status: "completed" | "mastered" | "incorrect"
  ) => {
    if (!currentProblem || !user) return;

    try {
      const nextReviewDate = getNextReviewDate(status);

      // Check if attempt already exists
      const existingAttempt = attempts.find(
        (a) => a.problem_id === currentProblem.id
      );

      if (existingAttempt) {
        // Update existing attempt
        const { error } = await supabase
          .from("leetcode_attempts")
          .update({
            status,
            next_review_date: nextReviewDate,
          })
          .eq("id", existingAttempt.id);

        if (error) throw error;
      } else {
        // Create new attempt
        const { error } = await supabase.from("leetcode_attempts").insert({
          problem_id: currentProblem.id,
          user_id: user.id,
          status,
          next_review_date: nextReviewDate,
        });

        if (error) throw error;
      }

      // Immediately remove current problem from queue and move to next
      const currentIndex = queue.findIndex((p) => p.id === currentProblem.id);
      const remainingQueue = queue.filter((p) => p.id !== currentProblem.id);

      // Update current problem immediately to prevent flash
      if (remainingQueue.length > 0) {
        // If there was a next problem in queue, use it
        const nextIndex =
          currentIndex < remainingQueue.length ? currentIndex : 0;
        setCurrentProblem(remainingQueue[nextIndex]);
      } else {
        setCurrentProblem(null);
      }

      // Refresh attempts which will trigger proper queue update
      await fetchAttempts();
      resetTimer();
    } catch (err) {
      console.error("Failed to save attempt:", err);
      setError("Failed to save progress");
    }
  };

  const selectProblem = (problem: LeetCodeProblem) => {
    setCurrentProblem(problem);
    resetTimer();
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

  const getProblemStatus = (problem: LeetCodeProblem) => {
    const attempt = attempts.find((a) => a.problem_id === problem.id);
    return attempt?.status || "not_attempted";
  };

  if (isLoading) {
    return (
      <div className="leetcode-prep-container">
        <div className="loading-state">
          <h2>Loading LeetCode problems...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leetcode-prep-container">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchProblems} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="leetcode-prep-container">
      <div className="leetcode-header">
        <h1>LeetCode Practice</h1>
        <p>Spaced repetition system for mastering coding problems</p>
        <div className="queue-stats">
          <span className="stat">
            Queue: <strong>{queue.length}</strong> problems
          </span>
          <span className="stat">
            Total: <strong>{problems.length}</strong> problems
          </span>
        </div>
      </div>

      <div className="leetcode-content">
        <div className="current-problem-section">
          {currentProblem ? (
            <div className="current-problem">
              <div className="problem-header">
                <h2>{currentProblem.name}</h2>
                <span
                  className="difficulty-badge"
                  style={{
                    backgroundColor: getDifficultyColor(
                      currentProblem.difficulty
                    ),
                  }}
                >
                  {currentProblem.difficulty}
                </span>
              </div>

              <div className="problem-meta">
                <span className="category">
                  {currentProblem.leetcode_categories.name}
                </span>
                <span className="status">
                  Status: {getProblemStatus(currentProblem).replace("_", " ")}
                </span>
              </div>

              <div className="timer-section">
                <div className="timer-display">
                  <span className="time">{formatTime(timeElapsed)}</span>
                </div>

                <div className="timer-controls">
                  {!isTimerRunning ? (
                    <button onClick={startTimer} className="timer-btn start">
                      <Play size={20} />
                      Start
                    </button>
                  ) : (
                    <button onClick={pauseTimer} className="timer-btn pause">
                      <Pause size={20} />
                      Pause
                    </button>
                  )}

                  <button onClick={resetTimer} className="timer-btn reset">
                    <RotateCcw size={20} />
                    Reset
                  </button>
                </div>
              </div>

              <div className="completion-actions">
                <button
                  onClick={() => handleComplete("incorrect")}
                  className="completion-btn incorrect"
                >
                  <X size={20} />
                  Incorrect (tomorrow)
                </button>

                <button
                  onClick={() => handleComplete("completed")}
                  className="completion-btn completed"
                >
                  <CheckCircle size={20} />
                  Completed (3 days)
                </button>

                <button
                  onClick={() => handleComplete("mastered")}
                  className="completion-btn mastered"
                >
                  <Star size={20} />
                  Mastered (1 week)
                </button>
              </div>
            </div>
          ) : (
            <div className="no-current-problem">
              <h2>🎉 All caught up!</h2>
              <p>No problems due for review right now.</p>
              <p>Check back later or select a problem from the queue.</p>
            </div>
          )}
        </div>

        <div className="queue-section">
          <h3>Practice Queue</h3>

          {queue.length === 0 ? (
            <div className="empty-queue">
              <p>No problems in queue</p>
            </div>
          ) : (
            <div className="queue-list">
              {queue.map((problem) => (
                <div
                  key={problem.id}
                  className={`queue-item ${
                    currentProblem?.id === problem.id ? "active" : ""
                  }`}
                  onClick={() => selectProblem(problem)}
                >
                  <div className="queue-item-header">
                    <span className="problem-name">{problem.name}</span>
                    <span
                      className="difficulty-badge small"
                      style={{
                        backgroundColor: getDifficultyColor(problem.difficulty),
                      }}
                    >
                      {problem.difficulty}
                    </span>
                  </div>

                  <div className="queue-item-meta">
                    <span className="category">
                      {problem.leetcode_categories.name}
                    </span>
                    <span className={`status ${getProblemStatus(problem)}`}>
                      {getProblemStatus(problem).replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
