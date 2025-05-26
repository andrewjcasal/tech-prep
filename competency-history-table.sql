-- Create competency_history table to track user progress
CREATE TABLE competency_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    competency_id UUID REFERENCES competencies(id) ON DELETE CASCADE,
    progress_before INTEGER DEFAULT 0 CHECK (progress_before >= 0 AND progress_before <= 100),
    progress_after INTEGER NOT NULL CHECK (progress_after >= 0 AND progress_after <= 100),
    improvement_notes TEXT, -- What the candidate could improve on next
    strengths_notes TEXT, -- What the candidate did well
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_competency_history_problem_id ON competency_history(problem_id);
CREATE INDEX idx_competency_history_competency_id ON competency_history(competency_id);
CREATE INDEX idx_competency_history_created_at ON competency_history(created_at);

-- Add RLS (Row Level Security) if needed
ALTER TABLE competency_history ENABLE ROW LEVEL SECURITY; 