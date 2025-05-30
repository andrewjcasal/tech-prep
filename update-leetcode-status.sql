-- Update the leetcode_attempts table to allow "incorrect" status
-- Run this in your Supabase SQL editor

-- Drop the existing check constraint
ALTER TABLE leetcode_attempts DROP CONSTRAINT IF EXISTS leetcode_attempts_status_check;
 
-- Add the new check constraint with "incorrect" included
ALTER TABLE leetcode_attempts ADD CONSTRAINT leetcode_attempts_status_check 
    CHECK (status IN ('completed', 'mastered', 'incorrect')); 