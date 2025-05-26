import { useState } from "react";
import { supabase } from "../lib/supabase";
import "./InterviewPrep.css";

interface InterviewPrepData {
  jobPosting: string;
  notes: string;
}

interface SuggestedProblem {
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

interface InterviewType {
  type: string;
  details: string;
  suggestedProblems: SuggestedProblem[];
}

interface StructuredResponse {
  interviews: InterviewType[];
}

interface ChatGPTResponse {
  response: StructuredResponse;
  error?: string;
  rawResponse?: string;
}

export default function InterviewPrep() {
  const [formData, setFormData] = useState<InterviewPrepData>({
    jobPosting: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<StructuredResponse | null>(null);
  const [error, setError] = useState<string>("");

  const handleInputChange = (field: keyof InterviewPrepData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.jobPosting.trim()) {
      setError("Please enter a job posting");
      return;
    }

    setIsLoading(true);
    setError("");
    setResponse(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "interview-prep",
        {
          body: {
            jobPosting: formData.jobPosting,
            notes: formData.notes,
          },
        }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      const result = data as ChatGPTResponse;
      if (result.error) {
        throw new Error(result.error);
      }

      setResponse(result.response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
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

  return (
    <div className="interview-prep-container">
      <h1>Technical Interview Preparation</h1>
      <p>
        Enter your job posting and any notes about the final round to get
        personalized preparation advice.
      </p>

      <form onSubmit={handleSubmit} className="prep-form">
        <div className="form-group">
          <label htmlFor="jobPosting">Job Posting *</label>
          <textarea
            id="jobPosting"
            value={formData.jobPosting}
            onChange={(e) => handleInputChange("jobPosting", e.target.value)}
            placeholder="Paste the job posting here..."
            rows={8}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Final Round Notes</label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            placeholder="Any additional notes about the final round interview (e.g., '4 interviews: coding, system design, behavioral, and technical deep-dive')..."
            rows={4}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !formData.jobPosting.trim()}
          className="submit-button"
        >
          {isLoading
            ? "Generating Preparation Plan..."
            : "Get Preparation Advice"}
        </button>
      </form>

      {error && (
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {response && (
        <div className="response-container">
          <h2>Your Interview Preparation Plan</h2>
          <div className="interviews-grid">
            {response.interviews.map((interview, index) => (
              <div key={index} className="interview-card">
                <h3 className="interview-type">{interview.type}</h3>
                <div className="interview-details">
                  <p>{interview.details}</p>
                </div>

                <div className="suggested-problems">
                  <h4>Suggested Practice Problems</h4>
                  <div className="problems-list">
                    {interview.suggestedProblems.map(
                      (problem, problemIndex) => (
                        <div key={problemIndex} className="problem-card">
                          <div className="problem-header">
                            <h5 className="problem-title">{problem.title}</h5>
                            <span
                              className="difficulty-badge"
                              style={{
                                backgroundColor: getDifficultyColor(
                                  problem.difficulty
                                ),
                              }}
                            >
                              {problem.difficulty}
                            </span>
                          </div>
                          <p className="problem-description">
                            {problem.description}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
