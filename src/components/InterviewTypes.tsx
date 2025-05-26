import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "./InterviewTypes.css";

interface CompetencyHistory {
  id: string;
  progress_before: number;
  progress_after: number;
  improvement_notes: string;
  strengths_notes: string;
  created_at: string;
  problems: {
    title: string;
    difficulty: string;
  };
}

interface Competency {
  id: string;
  name: string;
  description: string | null;
  progress_level: number;
  interview_type_id: string;
  created_at: string;
  competency_history?: CompetencyHistory[];
}

interface InterviewType {
  id: string;
  type: string;
  details: string;
  created_at: string;
  competencies: Competency[];
}

export default function InterviewTypes() {
  const [interviewTypes, setInterviewTypes] = useState<InterviewType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [expandedCompetencies, setExpandedCompetencies] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetchInterviewTypes();
  }, []);

  const fetchInterviewTypes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("interview_types")
        .select(
          `
          *,
          competencies (
            *,
            competency_history (
              *,
              problems (
                title,
                difficulty
              )
            )
          )
        `
        )
        .order("created_at", { ascending: false });

      console.log(data);
      if (error) {
        throw error;
      }

      setInterviewTypes(data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch interview types"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = (typeId: string) => {
    setExpandedTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(typeId)) {
        newSet.delete(typeId);
      } else {
        newSet.add(typeId);
      }
      return newSet;
    });
  };

  const toggleCompetencyExpanded = (competencyId: string) => {
    setExpandedCompetencies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(competencyId)) {
        newSet.delete(competencyId);
      } else {
        newSet.add(competencyId);
      }
      return newSet;
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "#28a745"; // Green
    if (progress >= 60) return "#ffc107"; // Yellow
    if (progress >= 40) return "#fd7e14"; // Orange
    return "#dc3545"; // Red
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

  const getProgressLabel = (progress: number) => {
    if (progress >= 80) return "Advanced";
    if (progress >= 60) return "Intermediate";
    if (progress >= 40) return "Beginner";
    return "Not Started";
  };

  const calculateTypeProgress = (competencies: Competency[]) => {
    if (competencies.length === 0) return 0;
    const total = competencies.reduce(
      (sum, comp) => sum + comp.progress_level,
      0
    );
    return Math.round(total / competencies.length);
  };

  if (isLoading) {
    return (
      <div className="interview-types-container">
        <div className="loading-state">
          <h2>Loading interview types...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="interview-types-container">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchInterviewTypes} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-types-container">
      <div className="interview-types-header">
        <h1>Interview Types & Competencies</h1>
        <p>Track your progress across different interview competencies</p>
      </div>

      {interviewTypes.length === 0 ? (
        <div className="empty-state">
          <h3>No interview types found</h3>
          <p>
            Generate some interview preparation plans to see competencies here.
          </p>
        </div>
      ) : (
        <div className="interview-types-grid">
          {interviewTypes.map((type) => {
            const isExpanded = expandedTypes.has(type.id);
            const overallProgress = calculateTypeProgress(type.competencies);

            return (
              <div key={type.id} className="interview-type-card">
                <div
                  className="interview-type-header"
                  onClick={() => toggleExpanded(type.id)}
                >
                  <div className="type-info">
                    <h3 className="type-title">{type.type}</h3>
                    <div className="type-stats">
                      <span className="competency-count">
                        {type.competencies.length} competencies
                      </span>
                      <div className="overall-progress">
                        <span className="progress-label">
                          {getProgressLabel(overallProgress)}
                        </span>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${overallProgress}%`,
                              backgroundColor:
                                getProgressColor(overallProgress),
                            }}
                          />
                        </div>
                        <span className="progress-percentage">
                          {overallProgress}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="expand-button">
                    {isExpanded ? "▼" : "▶"}
                  </button>
                </div>

                {isExpanded && (
                  <div className="competencies-section">
                    <p className="type-details">{type.details}</p>

                    {type.competencies.length === 0 ? (
                      <div className="no-competencies">
                        <p>
                          No competencies defined for this interview type yet.
                        </p>
                      </div>
                    ) : (
                      <div className="competencies-list">
                        {type.competencies.map((competency) => {
                          const isCompetencyExpanded = expandedCompetencies.has(
                            competency.id
                          );
                          const hasHistory =
                            competency.competency_history &&
                            competency.competency_history.length > 0;

                          return (
                            <div
                              key={competency.id}
                              className="competency-item"
                            >
                              <div
                                className="competency-header"
                                onClick={() =>
                                  hasHistory &&
                                  toggleCompetencyExpanded(competency.id)
                                }
                                style={{
                                  cursor: hasHistory ? "pointer" : "default",
                                }}
                              >
                                <div className="competency-info">
                                  <h4 className="competency-name">
                                    {competency.name}
                                    {hasHistory && (
                                      <span className="history-indicator">
                                        ({competency.competency_history!.length}{" "}
                                        sessions)
                                      </span>
                                    )}
                                  </h4>
                                  <div className="competency-progress">
                                    <span className="progress-label">
                                      {getProgressLabel(
                                        competency.progress_level
                                      )}
                                    </span>
                                    <div className="progress-bar">
                                      <div
                                        className="progress-fill"
                                        style={{
                                          width: `${competency.progress_level}%`,
                                          backgroundColor: getProgressColor(
                                            competency.progress_level
                                          ),
                                        }}
                                      />
                                    </div>
                                    <span className="progress-percentage">
                                      {competency.progress_level}%
                                    </span>
                                  </div>
                                </div>
                                {hasHistory && (
                                  <button className="expand-button">
                                    {isCompetencyExpanded ? "▼" : "▶"}
                                  </button>
                                )}
                              </div>

                              {competency.description && (
                                <p className="competency-description">
                                  {competency.description}
                                </p>
                              )}

                              {isCompetencyExpanded && hasHistory && (
                                <div className="competency-history">
                                  <h5 className="history-title">
                                    Progress History
                                  </h5>
                                  <div className="history-list">
                                    {competency
                                      .competency_history!.sort(
                                        (a, b) =>
                                          new Date(b.created_at).getTime() -
                                          new Date(a.created_at).getTime()
                                      )
                                      .map((historyItem) => (
                                        <div
                                          key={historyItem.id}
                                          className="history-item"
                                        >
                                          <div className="history-header">
                                            <div className="history-meta">
                                              <span className="problem-title">
                                                {historyItem.problems.title}
                                              </span>
                                              <span
                                                className="difficulty-badge"
                                                style={{
                                                  backgroundColor:
                                                    getDifficultyColor(
                                                      historyItem.problems
                                                        .difficulty
                                                    ),
                                                }}
                                              >
                                                {
                                                  historyItem.problems
                                                    .difficulty
                                                }
                                              </span>
                                              <span className="history-date">
                                                {new Date(
                                                  historyItem.created_at
                                                ).toLocaleDateString()}
                                              </span>
                                            </div>
                                            <div className="progress-change">
                                              <span className="progress-values">
                                                {historyItem.progress_before}% →{" "}
                                                {historyItem.progress_after}%
                                              </span>
                                              {historyItem.progress_after >
                                                historyItem.progress_before && (
                                                <span className="improvement-indicator">
                                                  +
                                                  {historyItem.progress_after -
                                                    historyItem.progress_before}
                                                  %
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          <div className="history-feedback">
                                            <div className="feedback-section">
                                              <h6>Strengths:</h6>
                                              <p className="strengths">
                                                {historyItem.strengths_notes}
                                              </p>
                                            </div>
                                            <div className="feedback-section">
                                              <h6>Areas for improvement:</h6>
                                              <p className="improvements">
                                                {historyItem.improvement_notes}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
