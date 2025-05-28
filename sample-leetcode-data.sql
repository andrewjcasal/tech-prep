-- Sample LeetCode data for testing
-- Insert sample categories first

INSERT INTO leetcode_categories (name) VALUES 
('Array'),
('String'),
('Hash Table'),
('Two Pointers'),
('Binary Search'),
('Stack'),
('Tree'),
('Dynamic Programming'),
('Math'),
('Greedy')
ON CONFLICT (name) DO NOTHING;

-- Insert 20 easy LeetCode problems
INSERT INTO leetcode_problems (name, difficulty, category_id) VALUES 
('Two Sum', 'Easy', (SELECT id FROM leetcode_categories WHERE name = 'Array' LIMIT 1)),
('Valid Parentheses', 'Easy', (SELECT id FROM leetcode_categories WHERE name = 'Stack' LIMIT 1)),
('Merge Two Sorted Lists', 'Easy', (SELECT id FROM leetcode_categories WHERE name = 'Tree' LIMIT 1)),
('Remove Duplicates from Sorted Array', 'Easy', (SELECT id FROM leetcode_categories WHERE name = 'Array' LIMIT 1)),
('Maximum Subarray', 'Easy', (SELECT id FROM leetcode_categories WHERE name = 'Dynamic Programming' LIMIT 1)),
('Length of Last Word', 'Easy', (SELECT id FROM leetcode_categories WHERE name = 'String' LIMIT 1)),
('Plus One', 'Easy', (SELECT id FROM leetcode_categories WHERE name = 'Array' LIMIT 1)),
('Sqrt(x)', 'Easy', (SELECT id FROM leetcode_categories WHERE name = 'Binary Search' LIMIT 1)),
('Climbing Stairs', 'Easy', (SELECT id FROM leetcode_categories WHERE name = 'Dynamic Programming' LIMIT 1)),
('Remove Element', 'Easy', (SELECT id FROM leetcode_categories WHERE name = 'Array' LIMIT 1)),
('Search Insert Position', 'Easy', (SELECT id FROM leetcode_categories WHERE name = 'Binary Search' LIMIT 1)),
('Implement strStr()', 'Easy', (SELECT id FROM leetcode_categories WHERE name = 'String' LIMIT 1)),
('Count and Say', 'Easy', (SELECT id FROM leetcode_categories WHERE name = 'String' LIMIT 1)),
('Longest Common Prefix', 'Easy', (SELECT id FROM leetcode_categories WHERE name = 'String' LIMIT 1)),
('Roman to Integer', 'Easy', (SELECT id FROM leetcode_categories WHERE name = 'Hash Table' LIMIT 1)),
('Palindrome Number', 'Easy', (SELECT id FROM leetcode_categories WHERE name = 'Math' LIMIT 1)),
('Reverse Integer', 'Easy', (SELECT id FROM leetcode_categories WHERE name = 'Math' LIMIT 1)),
('Valid Palindrome', 'Easy', (SELECT id FROM leetcode_categories WHERE name = 'Two Pointers' LIMIT 1)),
('Single Number', 'Easy', (SELECT id FROM leetcode_categories WHERE name = 'Hash Table' LIMIT 1)),
('Happy Number', 'Easy', (SELECT id FROM leetcode_categories WHERE name = 'Math' LIMIT 1));

-- Note: You can run this SQL in your Supabase SQL editor to populate the tables with sample data 