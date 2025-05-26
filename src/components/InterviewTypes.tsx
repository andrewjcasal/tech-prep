import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "./InterviewTypes.css";

interface Competency {
  id: string;
  name: string;
  description: string | null;
  progress_level: number;
  interview_type_id: string;
  created_at: string;
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
          competencies (*)
        `
        )
        .order("created_at", { ascending: false });

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

  const updateCompetencyProgress = async (
    competencyId: string,
    newProgress: number
  ) => {
    try {
      const { error } = await supabase
        .from("competencies")
        .update({ progress_level: newProgress })
        .eq("id", competencyId);

      if (error) {
        throw error;
      }

      // Update local state
      setInterviewTypes((prev) =>
        prev.map((type) => ({
          ...type,
          competencies: type.competencies.map((comp) =>
            comp.id === competencyId
              ? { ...comp, progress_level: newProgress }
              : comp
          ),
        }))
      );
    } catch (err) {
      console.error("Failed to update competency progress:", err);
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

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "#28a745"; // Green
    if (progress >= 60) return "#ffc107"; // Yellow
    if (progress >= 40) return "#fd7e14"; // Orange
    return "#dc3545"; // Red
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
                        {type.competencies.map((competency) => (
                          <div key={competency.id} className="competency-item">
                            <div className="competency-header">
                              <h4 className="competency-name">
                                {competency.name}
                              </h4>
                              <div className="competency-progress">
                                <span className="progress-label">
                                  {getProgressLabel(competency.progress_level)}
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

                            {competency.description && (
                              <p className="competency-description">
                                {competency.description}
                              </p>
                            )}

                            <div className="progress-controls">
                              <label htmlFor={`progress-${competency.id}`}>
                                Update Progress:
                              </label>
                              <input
                                id={`progress-${competency.id}`}
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={competency.progress_level}
                                onChange={(e) =>
                                  updateCompetencyProgress(
                                    competency.id,
                                    parseInt(e.target.value)
                                  )
                                }
                                className="progress-slider"
                              />
                            </div>
                          </div>
                        ))}
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
