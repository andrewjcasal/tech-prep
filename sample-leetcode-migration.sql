-- Sample migration for LeetCode attempts table
-- This shows the expected structure if the table doesn't exist yet

CREATE TABLE IF NOT EXISTS leetcode_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    problem_id BIGINT NOT NULL REFERENCES leetcode_problems(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'mastered', 'incorrect')),
    next_review_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leetcode_attempts_user_id ON leetcode_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_leetcode_attempts_problem_id ON leetcode_attempts(problem_id);
CREATE INDEX IF NOT EXISTS idx_leetcode_attempts_next_review_date ON leetcode_attempts(next_review_date);
CREATE INDEX IF NOT EXISTS idx_leetcode_attempts_status ON leetcode_attempts(status);

-- Enable Row Level Security
ALTER TABLE leetcode_attempts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for leetcode_attempts
CREATE POLICY "Users can view their own leetcode attempts" ON leetcode_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leetcode attempts" ON leetcode_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leetcode attempts" ON leetcode_attempts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leetcode attempts" ON leetcode_attempts
  FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for leetcode_problems and leetcode_categories if they don't exist
ALTER TABLE leetcode_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE leetcode_categories ENABLE ROW LEVEL SECURITY;

-- Allow all users to read leetcode problems and categories (they're shared)
CREATE POLICY "Allow public read access on leetcode_problems" ON leetcode_problems
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on leetcode_categories" ON leetcode_categories
    FOR SELECT USING (true);

-- Add updated_at trigger for leetcode_attempts
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leetcode_attempts_updated_at 
    BEFORE UPDATE ON leetcode_attempts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 