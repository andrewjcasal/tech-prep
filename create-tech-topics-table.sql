-- Create tech_topics table to store individual technology topics
-- These are extracted from improvement areas during interview evaluation

CREATE TABLE tech_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100), -- e.g., 'System Design', 'API Design', 'Coding', 'Behavioral'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a junction table to link competency history with tech topics
CREATE TABLE competency_history_tech_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competency_history_id UUID REFERENCES competency_history(id) ON DELETE CASCADE,
    tech_topic_id UUID REFERENCES tech_topics(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(competency_history_id, tech_topic_id)
);

-- Add indexes for better query performance
CREATE INDEX idx_tech_topics_name ON tech_topics(name);
CREATE INDEX idx_tech_topics_category ON tech_topics(category);
CREATE INDEX idx_competency_history_tech_topics_history_id ON competency_history_tech_topics(competency_history_id);
CREATE INDEX idx_competency_history_tech_topics_topic_id ON competency_history_tech_topics(tech_topic_id);

-- Add RLS (Row Level Security)
ALTER TABLE tech_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_history_tech_topics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tech_topics (global read, admin write)
CREATE POLICY "Anyone can view tech topics" ON tech_topics
  FOR SELECT USING (true);

CREATE POLICY "System can insert tech topics" ON tech_topics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update tech topics" ON tech_topics
  FOR UPDATE USING (true);

-- Create RLS policies for competency_history_tech_topics (linked through competency_history)
CREATE POLICY "Users can view their own competency history tech topics" ON competency_history_tech_topics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM competency_history
      JOIN competencies ON competencies.id = competency_history.competency_id
      JOIN interview_types ON interview_types.id = competencies.interview_type_id
      JOIN job_postings ON job_postings.id = interview_types.job_posting_id
      WHERE competency_history.id = competency_history_tech_topics.competency_history_id 
      AND job_postings.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert competency history tech topics" ON competency_history_tech_topics
  FOR INSERT WITH CHECK (true);

-- Insert some initial tech topics to avoid duplicates
INSERT INTO tech_topics (name, description, category) VALUES
-- System Design Topics
('Load Balancing', 'Load balancing is a critical technique for distributing incoming network traffic across multiple servers to ensure no single server becomes overwhelmed. This approach improves application availability, responsiveness, and fault tolerance by preventing any one server from becoming a bottleneck.

There are several types of load balancers to consider:
• Layer 4 (Transport Layer) load balancers that route traffic based on IP and port information
• Layer 7 (Application Layer) load balancers that can make routing decisions based on HTTP headers, URLs, or application data
• Hardware vs. software load balancers, each with different performance and cost characteristics

Common load balancing algorithms include round-robin, least connections, weighted round-robin, and IP hash. Understanding when to use each algorithm and how to implement health checks, session persistence, and failover mechanisms is essential for building robust distributed systems.', 'System Design'),

('Caching Strategies', 'Caching is one of the most effective ways to improve system performance by storing frequently accessed data in fast storage layers. A well-designed caching strategy can reduce database load, decrease response times, and improve user experience significantly.

Key caching patterns include:
• Cache-aside (lazy loading) where the application manages cache population
• Write-through caching that writes to cache and database simultaneously
• Write-behind (write-back) caching that writes to cache immediately and database asynchronously
• Refresh-ahead caching that proactively refreshes cache entries before they expire

Cache invalidation is often the most challenging aspect, requiring strategies like TTL (time-to-live), cache tags, or event-driven invalidation. Consider implementing caching at multiple levels: browser cache, CDN, reverse proxy (like Nginx), application cache (Redis/Memcached), and database query cache.', 'System Design'),

('Database Scaling', 'Database scaling involves techniques to handle increased load and data volume as applications grow. Understanding both vertical scaling (adding more power to existing machines) and horizontal scaling (adding more machines) is crucial for system design interviews.

Horizontal scaling techniques include:
• Read replicas to distribute read traffic across multiple database instances
• Database sharding to partition data across multiple databases based on a shard key
• Federation to split databases by function or feature
• Denormalization to reduce complex joins and improve read performance

Each approach has trade-offs in terms of consistency, complexity, and performance. Consider factors like data distribution, cross-shard queries, rebalancing strategies, and maintaining ACID properties when designing scaled database architectures.', 'System Design'),

('Microservices Architecture', 'Microservices architecture breaks down large applications into smaller, independently deployable services that communicate over well-defined APIs. This approach enables teams to develop, deploy, and scale services independently, improving development velocity and system resilience.

Key considerations for microservices include:
• Service boundaries and domain-driven design principles
• Inter-service communication patterns (synchronous vs. asynchronous)
• Data consistency across services using patterns like Saga or Event Sourcing
• Service discovery, load balancing, and circuit breakers for fault tolerance

However, microservices introduce complexity in areas like distributed tracing, monitoring, deployment orchestration, and data consistency. Understanding when to use microservices versus monolithic architecture and how to manage the operational overhead is essential for making informed architectural decisions.', 'System Design'),

('Message Queues', 'Message queues enable asynchronous communication between services, improving system resilience and scalability by decoupling producers and consumers. They provide reliable message delivery, load leveling, and the ability to handle traffic spikes gracefully.

Common message queue patterns include:
• Point-to-point queues for one-to-one communication
• Publish-subscribe topics for one-to-many communication
• Dead letter queues for handling failed message processing
• Message ordering and partitioning for maintaining sequence

Popular message queue systems like RabbitMQ, Apache Kafka, Amazon SQS, and Google Pub/Sub each have different characteristics regarding throughput, durability, ordering guarantees, and operational complexity. Understanding these trade-offs helps in selecting the right messaging solution for specific use cases.', 'System Design'),

('Circuit Breakers', 'Circuit breakers are a fault tolerance pattern that prevents cascading failures in distributed systems by monitoring service calls and "opening" the circuit when failure rates exceed a threshold. This pattern is essential for building resilient microservices architectures.

The circuit breaker pattern has three states:
• Closed: Normal operation, requests pass through
• Open: Failures detected, requests fail immediately without calling the service
• Half-open: Testing if the service has recovered by allowing limited requests

Implementation considerations include setting appropriate failure thresholds, timeout values, and recovery strategies. Libraries like Hystrix (Java), Polly (.NET), or custom implementations can provide circuit breaker functionality with monitoring and configuration capabilities.', 'System Design'),

-- API Design Topics
('RESTful Principles', 'REST (Representational State Transfer) is an architectural style for designing web APIs that emphasizes stateless communication, uniform interfaces, and resource-based URLs. Understanding REST principles is fundamental for creating scalable and maintainable web services.

Core REST principles include:
• Stateless communication where each request contains all necessary information
• Uniform interface using standard HTTP methods (GET, POST, PUT, DELETE, PATCH)
• Resource identification through URIs with hierarchical structure
• Representation of resources in formats like JSON or XML
• HATEOAS (Hypermedia as the Engine of Application State) for discoverability

Proper REST API design involves choosing appropriate HTTP status codes, designing intuitive URL structures, implementing proper error handling, and considering versioning strategies. Understanding when to deviate from pure REST principles for practical considerations is also important.', 'API Design'),

('Rate Limiting', 'Rate limiting is a critical technique for protecting APIs from abuse, ensuring fair usage among clients, and maintaining service quality under high load. It involves restricting the number of requests a client can make within a specific time window.

Common rate limiting algorithms include:
• Token bucket: Allows bursts up to a certain limit with steady refill rate
• Leaky bucket: Smooths out traffic by processing requests at a constant rate
• Fixed window: Simple counting within fixed time periods
• Sliding window: More accurate tracking using rolling time windows

Implementation can occur at various levels including API gateways, load balancers, or application code. Consider factors like rate limit headers, graceful degradation, different limits for different endpoints or user tiers, and distributed rate limiting across multiple servers.', 'API Design'),

('API Versioning', 'API versioning is essential for evolving APIs while maintaining backward compatibility for existing clients. A well-planned versioning strategy allows for innovation while minimizing disruption to API consumers.

Common versioning approaches include:
• URL path versioning (e.g., /v1/users, /v2/users)
• Header versioning using custom headers or Accept headers
• Query parameter versioning (e.g., ?version=1)
• Content negotiation using media types

Each approach has trade-offs in terms of simplicity, cacheability, and client implementation complexity. Consider deprecation policies, migration paths, and communication strategies when planning API evolution. Semantic versioning principles can guide when to increment major, minor, or patch versions.', 'API Design'),

-- Coding Topics
('Data Structures', 'Data structures are fundamental building blocks for organizing and storing data efficiently in computer programs. Mastering various data structures and understanding their time and space complexities is essential for solving algorithmic problems and building efficient software systems.

Essential data structures include:
• Arrays and dynamic arrays for sequential data storage
• Linked lists for dynamic memory allocation and insertion/deletion
• Stacks and queues for LIFO and FIFO operations
• Hash tables for fast key-value lookups
• Trees (binary trees, BSTs, heaps) for hierarchical data and efficient searching
• Graphs for representing relationships and networks

Understanding when to use each data structure depends on the specific requirements of your problem, such as the frequency of different operations (insertion, deletion, search), memory constraints, and performance requirements. Practice implementing these structures from scratch to understand their internal workings.', 'Coding'),

('Algorithms', 'Algorithms are step-by-step procedures for solving computational problems efficiently. A strong foundation in algorithmic thinking and common algorithm patterns is crucial for technical interviews and building efficient software solutions.

Key algorithmic categories include:
• Sorting algorithms (quicksort, mergesort, heapsort) with different time/space trade-offs
• Searching algorithms (binary search, depth-first search, breadth-first search)
• Dynamic programming for optimization problems with overlapping subproblems
• Greedy algorithms for making locally optimal choices
• Divide and conquer for breaking problems into smaller subproblems

Practice recognizing algorithm patterns in problems, analyzing time and space complexity, and implementing solutions clearly and correctly. Understanding the trade-offs between different algorithmic approaches helps in selecting the most appropriate solution for specific constraints.', 'Coding'),

('Time Complexity', 'Time complexity analysis using Big O notation is fundamental for evaluating algorithm efficiency and making informed decisions about algorithm selection. It describes how an algorithm''s runtime grows relative to the input size in the worst-case scenario.

Common time complexities include:
• O(1) - Constant time for operations like array access or hash table lookup
• O(log n) - Logarithmic time for binary search or balanced tree operations
• O(n) - Linear time for single-pass array operations
• O(n log n) - Linearithmic time for efficient sorting algorithms
• O(n²) - Quadratic time for nested loops over input
• O(2ⁿ) - Exponential time for recursive algorithms without memoization

Understanding how to analyze nested loops, recursive calls, and the impact of data structure operations on overall complexity is essential. Practice identifying the dominant term and expressing complexity in the simplest form while considering both average and worst-case scenarios.', 'Coding'),

-- Behavioral Topics
('STAR Method', 'The STAR method (Situation, Task, Action, Result) is a structured approach for answering behavioral interview questions that helps candidates provide concrete, compelling examples of their experience and skills. This framework ensures responses are comprehensive and demonstrate impact.

The STAR framework breaks down as follows:
• Situation: Set the context by describing the background and circumstances
• Task: Explain your responsibility or the challenge you needed to address
• Action: Detail the specific steps you took to address the situation
• Result: Share the outcomes and what you learned from the experience

Effective STAR responses should be specific rather than general, focus on your individual contributions rather than team efforts, quantify results when possible, and highlight skills relevant to the role you''re interviewing for. Practice crafting STAR responses for common behavioral questions about leadership, conflict resolution, failure, and achievement.', 'Behavioral'),

('Leadership Examples', 'Demonstrating leadership skills through concrete examples is crucial for senior technical roles, even when the position isn''t formally a management role. Leadership in technical contexts often involves influence without authority, mentoring others, and driving technical initiatives.

Types of technical leadership include:
• Technical mentoring and knowledge sharing with junior developers
• Leading cross-functional projects or technical initiatives
• Driving architectural decisions and technical standards
• Facilitating technical discussions and building consensus
• Taking ownership of critical systems or complex problems

When preparing leadership examples, focus on situations where you influenced outcomes, helped others grow, made difficult technical decisions, or took initiative to solve important problems. Emphasize the impact of your leadership on team productivity, code quality, system reliability, or business outcomes.', 'Behavioral'),

('Conflict Resolution', 'Conflict resolution skills are essential in collaborative technical environments where disagreements about technical approaches, priorities, or resource allocation are common. Effective conflict resolution involves understanding different perspectives, finding common ground, and working toward mutually beneficial solutions.

Common sources of technical conflicts include:
• Disagreements about technical architecture or implementation approaches
• Resource allocation and priority conflicts between teams or projects
• Code review feedback and technical standards enforcement
• Timeline pressures and scope disagreements
• Communication breakdowns between technical and non-technical stakeholders

Effective conflict resolution strategies include active listening, seeking to understand underlying concerns, focusing on shared goals, proposing compromise solutions, and escalating appropriately when necessary. Prepare examples that show your ability to navigate difficult conversations while maintaining professional relationships and achieving positive outcomes.', 'Behavioral'); 