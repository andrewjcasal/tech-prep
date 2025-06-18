import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, CheckCircle, X } from "lucide-react";
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
  level: number;
  status: any;
}

export default function LeetCodePrep() {
  const [currentProblem, setCurrentProblem] = useState<LeetCodeProblem | null>(
    null
  );
  const { user } = useAuth();

  const [totalProblemsCount, setTotalProblemsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Timer state
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Queue state
  const [queue, setQueue] = useState<LeetCodeProblem[]>([]);

  const fetchProblems = async () => {
    const { count, data, error } = await supabase
      .from("leetcode_problems")
      .select("*, leetcode_categories(*), leetcode_attempts(*)", {
        count: "exact",
      });

    if (error || !data || data.length === 0) {
      console.error("Error fetching problems:", error);
      setIsLoading(false);
      return;
    }

    setTotalProblemsCount(count || 0);

    const filteredQueue = data.filter(
      (problem) =>
        (problem.leetcode_attempts.length &&
          problem.leetcode_attempts[0].next_review_date <
            new Date().toISOString()) ||
        !problem.leetcode_attempts.length
    );

    const transformedQueue = filteredQueue.map((problem) => ({
      ...problem,
      status: problem.leetcode_attempts.length
        ? problem.leetcode_attempts[0].level === 0
          ? "incorrect"
          : `v${problem.leetcode_attempts[0].level}`
        : "not attempted",
      level: problem.leetcode_attempts.length
        ? problem.leetcode_attempts[0].level
        : 0,
    }));

    console.log("transformedQueue", transformedQueue[0]);

    setQueue(transformedQueue);
    setCurrentProblem(transformedQueue[0]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProblems();
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

  const getDaysToAdd = (level: number) => {
    switch (level) {
      case 0:
        return 1;
      case 1:
        return 2;
      case 2:
        return 4;
      case 3:
        return 7;
      case 4:
        return 14;
      case 5:
        return 30;
      case 6:
        return 60;
      default:
        return 60;
    }
  };
  const getNextReviewDate = (
    level: number,
    status: "completed" | "mastered" | "incorrect"
  ) => {
    const now = new Date();

    const daysToAdd = getDaysToAdd(level);
    if (status === "completed") {
      now.setDate(now.getDate() + daysToAdd);
    } else if (status === "incorrect") {
      now.setDate(now.getDate() + 1);
    }
    return now.toISOString();
  };

  const handleComplete = async (
    currentProblem: LeetCodeProblem,
    status: "completed" | "incorrect"
  ) => {
    const nextReviewDate = getNextReviewDate(currentProblem.level, status);
    const { data, error } = await supabase.from("leetcode_attempts").upsert(
      {
        problem_id: currentProblem.id,
        user_id: user?.id,
        next_review_date: nextReviewDate,
        level: status === "completed" ? currentProblem.level + 1 : 0,
      },
      {
        onConflict: "problem_id,user_id",
      }
    );

    if (error) {
      console.error("Error updating leetcode_attempts:", error);
    } else {
      console.log("leetcode_attempts updated successfully:", data);
      const newQueue = queue.filter(
        (problem) => problem.id !== currentProblem.id
      );
      setQueue(newQueue);
      setCurrentProblem(newQueue[0]);
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

  if (isLoading) {
    return (
      <div className="leetcode-prep-container">
        <div className="loading-state">
          <h2>Loading LeetCode problems...</h2>
        </div>
      </div>
    );
  }

  const getCompletedDays = (level: number) => {
    switch (level) {
      case 0:
        return "tomorrow";
      case 1:
        return "2 days";
      case 2:
        return "4 days";
      case 3:
        return "7 days";
      case 4:
        return "14 days";
      case 5:
        return "30 days";
      case 6:
        return "60 days";
      default:
        return "60 days";
    }
  };

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
            Total: <strong>{totalProblemsCount}</strong> problems
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
                  className="difficulty-badge py-1 px-2"
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
                <span className="category mr-2">
                  {currentProblem.leetcode_categories.name}
                </span>
                <span className="status">Status: {currentProblem.status}</span>
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
                  onClick={() => handleComplete(currentProblem, "incorrect")}
                  className="completion-btn incorrect"
                >
                  <X size={20} />
                  Incorrect (tomorrow)
                </button>

                <button
                  onClick={() => handleComplete(currentProblem, "completed")}
                  className="completion-btn completed"
                >
                  <CheckCircle size={20} />
                  Completed ({getCompletedDays(currentProblem.level)})
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
                    <span className="status">Status: {problem.status}</span>
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
