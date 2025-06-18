-- Rollback script to reverse the migration of completed column
-- This will restore the completed and user_id columns to the problems table

-- Step 1: Add back the completed and user_id columns to problems table
ALTER TABLE problems ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Migrate data back from user_problem_progress to problems
UPDATE problems 
SET 
    completed = upp.completed,
    user_id = upp.user_id
FROM user_problem_progress upp
WHERE problems.id = upp.problem_id;

-- Step 3: Drop the user_problem_progress table and related objects
DROP TRIGGER IF EXISTS update_user_problem_progress_updated_at ON user_problem_progress;
DROP POLICY IF EXISTS "Users can delete their own problem progress" ON user_problem_progress;
DROP POLICY IF EXISTS "Users can update their own problem progress" ON user_problem_progress;
DROP POLICY IF EXISTS "Users can insert their own problem progress" ON user_problem_progress;
DROP POLICY IF EXISTS "Users can view their own problem progress" ON user_problem_progress;
DROP TABLE IF EXISTS user_problem_progress;

-- Note: This rollback assumes that each problem was only associated with one user
-- If multiple users had progress on the same problem, only the last user's data will be preserved
-- in the problems table due to the nature of the original schema 