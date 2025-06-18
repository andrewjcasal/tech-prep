import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "./InterviewTypes.css";
import { useAuth } from "../contexts/AuthContext";

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
  competency_history_tech_topics?: Array<{
    tech_topics: {
      id: string;
      name: string;
      description: string;
    };
  }>;
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
  const [generatingProblems, setGeneratingProblems] = useState<Set<string>>(
    new Set()
  );
  const { user } = useAuth();

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
              ),
              competency_history_tech_topics (
                tech_topics (
                  id,
                  name,
                  description
                )
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

  const generateProblems = async (interviewTypeId: string) => {
    try {
      setGeneratingProblems((prev) => new Set(prev).add(interviewTypeId));

      const { data, error } = await supabase.functions.invoke(
        "generate-problems",
        {
          body: {
            interviewTypeId: interviewTypeId,
          },
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Show success message
      alert(`Successfully generated ${data.count} new problems!`);

      // Refresh the data to show new problems
      await fetchInterviewTypes();
    } catch (err) {
      console.error("Failed to generate problems:", err);
      alert(
        `Failed to generate problems: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setGeneratingProblems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(interviewTypeId);
        return newSet;
      });
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
    if (progress > 90) return "#28a745"; // Green
    if (progress >= 80) return "#ffc107"; // Yellow
    if (progress > 60) return "#fd7e14"; // Orange
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

  const isBehavioralType = (type: string) => {
    return (
      type.toLowerCase().includes("behavioral") ||
      type.toLowerCase().includes("culture") ||
      type.toLowerCase().includes("leadership")
    );
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
            const isGenerating = generatingProblems.has(type.id);

            return (
              <div key={type.id} className="interview-type-card">
                <div
                  className="interview-type-header px-4 py-2"
                  onClick={() => toggleExpanded(type.id)}
                >
                  <div className="type-info">
                    <h3 className="gap-2 flex items-center mb-0">
                      <span className="border rounded-lg px-2 bg-gray-200 border-gray-300 text-lg text-gray-500">
                        {type.competencies.length}
                      </span>
                      <span>{type.type}</span>
                    </h3>
                  </div>
                  <div className="header-actions">
                    {isBehavioralType(type.type) && (
                      <button
                        className={`generate-problems-button ${
                          isGenerating ? "generating" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          generateProblems(type.id);
                        }}
                        disabled={isGenerating}
                      >
                        {isGenerating ? "Generating..." : "Generate Problems"}
                      </button>
                    )}
                    <button className="expand-button">
                      {isExpanded ? "▼" : "▶"}
                    </button>
                  </div>
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
                                className="h-[80px] flex flex-row grid grid-cols-3 gap-2 items-center"
                                onClick={() =>
                                  hasHistory &&
                                  toggleCompetencyExpanded(competency.id)
                                }
                                style={{
                                  cursor: hasHistory ? "pointer" : "default",
                                }}
                              >
                                <div className="competency-info">
                                  <div className="flex flex-row gap-3 items-center">
                                    {(() => {
                                      const history =
                                        competency.competency_history || [];
                                      const progress =
                                        history.length > 0
                                          ? Math.round(
                                              history
                                                .slice(0, 2)
                                                .reduce(
                                                  (sum, item) =>
                                                    sum + item.progress_after,
                                                  0
                                                ) / Math.min(history.length, 2)
                                            )
                                          : 0;
                                      return (
                                        <span
                                          className="border rounded-xl h-[40px] w-[40px] flex items-center justify-center px-2 text-lg font-semibold text-white"
                                          style={{
                                            backgroundColor:
                                              getProgressColor(progress),
                                            borderColor:
                                              getProgressColor(progress),
                                          }}
                                        >
                                          {progress}
                                        </span>
                                      );
                                    })()}
                                    <h4 className="competency-name flex flex-col gap-1">
                                      {competency.name}
                                      {hasHistory && (
                                        <span className="history-indicator">
                                          {
                                            competency.competency_history!
                                              .length
                                          }{" "}
                                          sessions
                                        </span>
                                      )}
                                    </h4>
                                  </div>
                                </div>
                                {competency.description && (
                                  <p className="competency-description col-span-2">
                                    {competency.description}
                                  </p>
                                )}
                              </div>

                              {isCompetencyExpanded && hasHistory && (
                                <div className="competency-history">
                                  <div className="history-list">
                                    {competency
                                      .competency_history!.sort(
                                        (a, b) =>
                                          new Date(b.created_at).getTime() -
                                          new Date(a.created_at).getTime()
                                      )
                                      .map((historyItem) => (
                                        <div key={historyItem.id}>
                                          <div className="history-header">
                                            <div className="history-meta">
                                              <span
                                                className="difficulty-badge px-2 py-0.5"
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
                                              <span className="problem-title">
                                                {historyItem.problems.title}
                                              </span>
                                              <span className="history-date">
                                                {new Date(
                                                  historyItem.created_at
                                                ).toLocaleDateString()}
                                              </span>
                                            </div>
                                            <div className="progress-change">
                                              <span className="progress-values">
                                                {historyItem.progress_after}%
                                              </span>
                                            </div>
                                          </div>

                                          <div className="history-feedback">
                                            <div className="flex flex-row grid grid-cols-2 gap-2">
                                              <p className="strengths">
                                                <span className="font-bold mr-1">
                                                  Strengths:
                                                </span>
                                                {historyItem.strengths_notes}
                                              </p>
                                              <div className="improvements-section">
                                                <p className="improvements">
                                                  <span className="font-bold mr-1">
                                                    Areas for improvement:
                                                  </span>
                                                  {
                                                    historyItem.improvement_notes
                                                  }
                                                </p>

                                                {/* Display tech topics if available */}
                                                {historyItem.competency_history_tech_topics &&
                                                  historyItem
                                                    .competency_history_tech_topics
                                                    .length > 0 && (
                                                    <div className="tech-topics-section mt-3">
                                                      <h6 className="tech-topics-title">
                                                        Related Tech Topics to
                                                        Study:
                                                      </h6>
                                                      <div className="tech-topics-list">
                                                        {historyItem.competency_history_tech_topics.map(
                                                          (
                                                            topicLink: any,
                                                            topicIndex: number
                                                          ) => (
                                                            <div
                                                              key={topicIndex}
                                                              className="tech-topic-pill"
                                                            >
                                                              {
                                                                topicLink
                                                                  .tech_topics
                                                                  .name
                                                              }
                                                            </div>
                                                          )
                                                        )}
                                                      </div>
                                                    </div>
                                                  )}
                                              </div>
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
