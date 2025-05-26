-- Sample competencies for different interview types
-- Run this after you have some interview_types in your database

-- For API Design interview type
INSERT INTO competencies (interview_type_id, name, description, progress_level) 
SELECT 
    it.id,
    'Rate Limiting',
    'Understanding and implementing rate limiting strategies to prevent API abuse and ensure fair usage across clients.',
    0
FROM interview_types it 
WHERE it.type ILIKE '%API%' OR it.type ILIKE '%design%'
LIMIT 1;

INSERT INTO competencies (interview_type_id, name, description, progress_level) 
SELECT 
    it.id,
    'RESTful Principles',
    'Designing APIs that follow REST architectural constraints including statelessness, uniform interface, and proper HTTP methods.',
    0
FROM interview_types it 
WHERE it.type ILIKE '%API%' OR it.type ILIKE '%design%'
LIMIT 1;

INSERT INTO competencies (interview_type_id, name, description, progress_level) 
SELECT 
    it.id,
    'Authentication & Authorization',
    'Implementing secure authentication mechanisms (JWT, OAuth) and proper authorization controls for API endpoints.',
    0
FROM interview_types it 
WHERE it.type ILIKE '%API%' OR it.type ILIKE '%design%'
LIMIT 1;

INSERT INTO competencies (interview_type_id, name, description, progress_level) 
SELECT 
    it.id,
    'API Versioning',
    'Strategies for versioning APIs to maintain backward compatibility while allowing for evolution and improvements.',
    0
FROM interview_types it 
WHERE it.type ILIKE '%API%' OR it.type ILIKE '%design%'
LIMIT 1;

INSERT INTO competencies (interview_type_id, name, description, progress_level) 
SELECT 
    it.id,
    'Error Handling',
    'Designing consistent error responses with appropriate HTTP status codes and meaningful error messages.',
    0
FROM interview_types it 
WHERE it.type ILIKE '%API%' OR it.type ILIKE '%design%'
LIMIT 1;

-- For System Design interview type
INSERT INTO competencies (interview_type_id, name, description, progress_level) 
SELECT 
    it.id,
    'Load Balancers',
    'Understanding different load balancing algorithms and when to use Layer 4 vs Layer 7 load balancers.',
    0
FROM interview_types it 
WHERE it.type ILIKE '%system%' OR it.type ILIKE '%design%'
LIMIT 1;

INSERT INTO competencies (interview_type_id, name, description, progress_level) 
SELECT 
    it.id,
    'Database Scaling',
    'Techniques for scaling databases including read replicas, sharding, and choosing between SQL vs NoSQL solutions.',
    0
FROM interview_types it 
WHERE it.type ILIKE '%system%' OR it.type ILIKE '%design%'
LIMIT 1;

INSERT INTO competencies (interview_type_id, name, description, progress_level) 
SELECT 
    it.id,
    'Caching Strategies',
    'Implementing caching at different layers (browser, CDN, application, database) and cache invalidation strategies.',
    0
FROM interview_types it 
WHERE it.type ILIKE '%system%' OR it.type ILIKE '%design%'
LIMIT 1;

INSERT INTO competencies (interview_type_id, name, description, progress_level) 
SELECT 
    it.id,
    'Microservices Architecture',
    'Designing systems with microservices including service communication, data consistency, and deployment strategies.',
    0
FROM interview_types it 
WHERE it.type ILIKE '%system%' OR it.type ILIKE '%design%'
LIMIT 1;

INSERT INTO competencies (interview_type_id, name, description, progress_level) 
SELECT 
    it.id,
    'CAP Theorem',
    'Understanding the trade-offs between Consistency, Availability, and Partition tolerance in distributed systems.',
    0
FROM interview_types it 
WHERE it.type ILIKE '%system%' OR it.type ILIKE '%design%'
LIMIT 1;

-- For Technical Coding interview type
INSERT INTO competencies (interview_type_id, name, description, progress_level) 
SELECT 
    it.id,
    'Data Structures',
    'Proficiency with arrays, linked lists, trees, graphs, hash tables, and choosing the right data structure for problems.',
    0
FROM interview_types it 
WHERE it.type ILIKE '%coding%' OR it.type ILIKE '%technical%'
LIMIT 1;

INSERT INTO competencies (interview_type_id, name, description, progress_level) 
SELECT 
    it.id,
    'Algorithms',
    'Understanding sorting, searching, dynamic programming, greedy algorithms, and graph traversal techniques.',
    0
FROM interview_types it 
WHERE it.type ILIKE '%coding%' OR it.type ILIKE '%technical%'
LIMIT 1;

INSERT INTO competencies (interview_type_id, name, description, progress_level) 
SELECT 
    it.id,
    'Time & Space Complexity',
    'Analyzing and optimizing algorithm efficiency using Big O notation for both time and space complexity.',
    0
FROM interview_types it 
WHERE it.type ILIKE '%coding%' OR it.type ILIKE '%technical%'
LIMIT 1;

INSERT INTO competencies (interview_type_id, name, description, progress_level) 
SELECT 
    it.id,
    'Problem Solving Approach',
    'Systematic approach to breaking down problems, edge case handling, and communicating solution strategy.',
    0
FROM interview_types it 
WHERE it.type ILIKE '%coding%' OR it.type ILIKE '%technical%'
LIMIT 1;

-- For Behavioral interview type
INSERT INTO competencies (interview_type_id, name, description, progress_level) 
SELECT 
    it.id,
    'STAR Method',
    'Structuring behavioral responses using Situation, Task, Action, Result framework for clear storytelling.',
    0
FROM interview_types it 
WHERE it.type ILIKE '%behavioral%' OR it.type ILIKE '%culture%'
LIMIT 1;

INSERT INTO competencies (interview_type_id, name, description, progress_level) 
SELECT 
    it.id,
    'Leadership Examples',
    'Demonstrating leadership skills through concrete examples of leading projects, mentoring, or driving initiatives.',
    0
FROM interview_types it 
WHERE it.type ILIKE '%behavioral%' OR it.type ILIKE '%culture%'
LIMIT 1;

INSERT INTO competencies (interview_type_id, name, description, progress_level) 
SELECT 
    it.id,
    'Conflict Resolution',
    'Examples of handling disagreements, difficult conversations, and finding collaborative solutions.',
    0
FROM interview_types it 
WHERE it.type ILIKE '%behavioral%' OR it.type ILIKE '%culture%'
LIMIT 1;

INSERT INTO competencies (interview_type_id, name, description, progress_level) 
SELECT 
    it.id,
    'Growth Mindset',
    'Demonstrating continuous learning, handling failure, receiving feedback, and adapting to change.',
    0
FROM interview_types it 
WHERE it.type ILIKE '%behavioral%' OR it.type ILIKE '%culture%'
LIMIT 1; 