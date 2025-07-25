import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "./ProblemsList.css";

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  interview_type_id: string;
  created_at: string;
  interview_types: {
    type: string;
    details: string;
    job_postings: {
      content: string;
      notes: string;
      created_at: string;
    };
  };
  user_problem_progress: {
    completed: boolean;
  }[];
}

interface ProblemsListProps {
  onProblemClick?: (problemId: string) => void;
}

export default function ProblemsList({ onProblemClick }: ProblemsListProps) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [selectedInterviewTypes, setSelectedInterviewTypes] = useState<
    Set<string>
  >(() => {
    // Load from localStorage on component mount
    const saved = localStorage.getItem("selectedInterviewTypes");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return new Set(Array.isArray(parsed) ? parsed : []);
      } catch {
        return new Set();
      }
    }
    return new Set();
  });

  useEffect(() => {
    fetchProblems();
  }, []);

  // Save selectedInterviewTypes to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      "selectedInterviewTypes",
      JSON.stringify(Array.from(selectedInterviewTypes))
    );
  }, [selectedInterviewTypes]);

  const fetchProblems = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("problems")
        .select(
          `
          *,
          interview_types (
            type,
            details,
            job_postings (
              content,
              notes,
              created_at
            )
          ),
          user_problem_progress (completed)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setProblems(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch problems");
    } finally {
      setIsLoading(false);
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

  const getUniqueInterviewTypes = () => {
    const types = problems.map((p) => p.interview_types.type);
    return [...new Set(types)];
  };

  const toggleInterviewType = (type: string) => {
    setSelectedInterviewTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const filteredProblems = problems.filter((problem) => {
    const difficultyMatch =
      filterDifficulty === "all" || problem.difficulty === filterDifficulty;
    const typeMatch =
      selectedInterviewTypes.size === 0 ||
      selectedInterviewTypes.has(problem.interview_types.type);
    return difficultyMatch && typeMatch;
  });

  if (isLoading) {
    return (
      <div className="problems-list-container">
        <div className="loading-state">
          <h2>Loading problems...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="problems-list-container">
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
    <div className="problems-list-container">
      <div className="problems-header">
        <h1 className="text-2xl">Problems List</h1>
      </div>

      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="difficulty-filter">Difficulty:</label>
          <select
            id="difficulty-filter"
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Interview Types:</label>
          <div className="checkbox-group">
            {getUniqueInterviewTypes().map((type) => (
              <label key={type} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedInterviewTypes.has(type)}
                  onChange={() => toggleInterviewType(type)}
                />
                <span className="checkbox-label">{type}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="problems-stats">
        <span className="stat">
          Total Problems: <strong>{problems.length}</strong>
        </span>
        <span className="stat">
          Showing: <strong>{filteredProblems.length}</strong>
        </span>
      </div>

      {filteredProblems.length === 0 ? (
        <div className="empty-state">
          <h3>No problems found</h3>
          <p>
            Try adjusting your filters or generate some problems from the
            Interview Prep page.
          </p>
        </div>
      ) : (
        <div className="problems-grid grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProblems.map((problem) => (
            <div
              key={problem.id}
              className="problem-card flex flex-col justify-between"
            >
              <div>
                <div className="problem-meta gap-2 mb-3">
                  <span className="interview-type-tag px-2 py-0.5">
                    {problem.interview_types.type}
                  </span>
                  <span
                    className="difficulty-badge px-2 py-0.5"
                    style={{
                      backgroundColor: getDifficultyColor(problem.difficulty),
                    }}
                  >
                    {problem.difficulty}
                  </span>
                  <span className="created-date">
                    {new Date(problem.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="problem-header mb-2">
                  <h3 className="problem-title">{problem.title}</h3>
                </div>

                <p className="problem-description">{problem.description}</p>
              </div>
              {onProblemClick && (
                <div className="problem-actions grid grid-cols-2 gap-4">
                  <button
                    onClick={() => onProblemClick(problem.id)}
                    className="practice-button px-4 py-2"
                  >
                    Start Interview
                  </button>
                  {problem.user_problem_progress?.[0]?.completed && (
                    <button
                      onClick={() =>
                        window.open(
                          `/interview/${problem.id}?feedback=true`,
                          "_blank"
                        )
                      }
                      className="feedback-button"
                    >
                      View Feedback
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
