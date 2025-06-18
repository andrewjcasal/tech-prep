-- Migration to move completed column from problems table to a new user_problem_progress table
-- This creates a proper many-to-many relationship between users and problems

-- Step 1: Create the new user_problem_progress table
CREATE TABLE IF NOT EXISTS user_problem_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure each user can only have one progress record per problem
    UNIQUE(user_id, problem_id)
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_problem_progress_user_id ON user_problem_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_problem_progress_problem_id ON user_problem_progress(problem_id);
CREATE INDEX IF NOT EXISTS idx_user_problem_progress_completed ON user_problem_progress(completed);
CREATE INDEX IF NOT EXISTS idx_user_problem_progress_completed_at ON user_problem_progress(completed_at);

-- Step 3: Enable Row Level Security
ALTER TABLE user_problem_progress ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Users can view their own problem progress" ON user_problem_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own problem progress" ON user_problem_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own problem progress" ON user_problem_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own problem progress" ON user_problem_progress
    FOR DELETE USING (auth.uid() = user_id);

-- Step 5: Migrate existing data from problems table
-- Insert records for all problems with user_id, handling NULL completed values
INSERT INTO user_problem_progress (user_id, problem_id, completed, completed_at, created_at, updated_at)
SELECT 
    p.user_id,
    p.id as problem_id,
    COALESCE(p.completed, false) as completed,
    CASE 
        WHEN p.completed = true THEN p.updated_at 
        ELSE NULL 
    END as completed_at,
    NOW() as created_at,
    NOW() as updated_at
FROM problems p
WHERE p.user_id IS NOT NULL
ON CONFLICT (user_id, problem_id) DO UPDATE SET
    completed = EXCLUDED.completed,
    completed_at = EXCLUDED.completed_at,
    updated_at = EXCLUDED.updated_at;

-- Step 6: Drop existing RLS policies on problems table that depend on user_id
DROP POLICY IF EXISTS "Users can view their own problems" ON problems;
DROP POLICY IF EXISTS "Users can insert their own problems" ON problems;
DROP POLICY IF EXISTS "Users can update their own problems" ON problems;
DROP POLICY IF EXISTS "Users can delete their own problems" ON problems;

-- Step 7: Remove the completed and user_id columns from problems table
-- Note: We'll also remove user_id since problems should be shared across users
-- and completion status is now tracked in the separate table
ALTER TABLE problems DROP COLUMN IF EXISTS completed;
ALTER TABLE problems DROP COLUMN IF EXISTS user_id;

-- Step 8: Create new RLS policies for problems table (problems are now shared across users)
-- Users can view all problems (they're shared resources)
CREATE POLICY "Users can view all problems" ON problems
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only allow authenticated users to insert problems (you might want to restrict this further)
CREATE POLICY "Authenticated users can insert problems" ON problems 
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only allow authenticated users to update problems (you might want to restrict this further)
CREATE POLICY "Authenticated users can update problems" ON problems
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Only allow authenticated users to delete problems (you might want to restrict this further)
CREATE POLICY "Authenticated users can delete problems" ON problems
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Step 7: Add updated_at trigger for user_problem_progress
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_problem_progress_updated_at 
    BEFORE UPDATE ON user_problem_progress 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 