-------
WRITTEN BY CLAUDE! REQUIRES REVISION!
-------


ORBIT
Master Product & Technical Implementation Blueprint
Version: 1.0
Project status: Pre-development / Architecture Planning
Initial target: Concordia University students, Montréal
Product category: Cross-platform university companion
Technology direction: React Native · Expo · TypeScript · Supabase · PostgreSQL

1. PRODUCT VISION
1.1 What is ORBIT?
ORBIT is a unified university-life platform designed to make navigating, organizing, experiencing, and coordinating university life significantly easier.

Instead of requiring students to switch between multiple applications, websites, university portals, maps, messaging platforms, and unofficial information sources, ORBIT brings essential campus experiences into one connected environment.

ORBIT should feel like a central operating system for university life.

It is not simply a timetable application, a campus map, or a student social network. Its value comes from the interaction between these systems.

A student’s schedule should understand where their next class is. Their map should help them get there. Their friends’ availability should help them coordinate their free time. Campus Live should help them decide where to eat, study, or spend their time.

Everything should feel interconnected.

1.2 Product mission
Make university life more organized, connected, informed, and effortless through one intelligent, beautifully designed platform.

1.3 Initial audience
Primary audience:

Concordia University students.
Undergraduate and graduate students.
Students attending the SGW and Loyola campuses.
Future audience:

Students at other universities.
Universities interested in adopting ORBIT.
Potential institutional partnerships.
ORBIT must be designed so that adding another university does not require rebuilding its core architecture.

1.4 Product principles
One unified experience: All modules must operate as parts of one application.
Useful before impressive: Every feature must solve an actual student problem.
Privacy by design: Students control what information they share.
Accuracy over assumptions: Never present unverified campus information as fact.
Premium experience: The interface should feel like a professionally designed commercial product.
Scalable foundations: Build with future growth in mind without unnecessarily complicating the MVP.
Low friction: Common student actions should require as few interactions as possible.
Data integrity: The same information should not be independently duplicated across modules.
2. THE FOUR CORE MODULES
The application consists of four interconnected modules.

MODULE A — MY SCHEDULE
Purpose
A centralized academic calendar that allows students to import, organize, understand, and manage their university schedules.

Core functionality
Schedule creation

Manual class creation.
Course name and course code.
Section information.
Building and room.
Start and end times.
Days of the week.
Semester and academic term.
Recurring classes.
Individual event editing.
Schedule importing

Support the following import methods:

ICS calendar files.
PDF schedules.
Images and screenshots.
Manual entry.
Import workflow:

Student uploads a file.
The application identifies its format.
A processing service extracts relevant information.
Extracted events are converted into ORBIT’s standardized event format.
A review screen displays the detected classes.
Student can edit, remove, or correct information.
Student confirms the import.
Validated events are saved.
Dashboard and other connected modules update.
Never silently add unverified extracted events to a student’s schedule.

Calendar interface

Daily view.
Weekly view.
Upcoming classes.
Current-day overview.
Course-specific colors.
Class details.
Conflict detection.
Schedule switching between semesters.
Time-zone handling.
Intelligent features

Upcoming class countdown.
Time until next class.
Travel-time awareness between buildings when reliable routing data exists.
Schedule conflict warnings.
Free-period identification.
Optional notifications before classes.
Examination and special-event support in later releases.
Important technical requirement
Use one standardized class-event data model throughout ORBIT.

Do not create separate incompatible event models for the calendar, friends module, dashboard, and notifications.

MODULE B — CAMPUS NAVIGATOR
Purpose
A campus navigation system that helps students understand university buildings, locate classrooms, discover facilities, and eventually navigate between destinations indoors.

Core functionality
Campus selection

Sir George Williams Campus.
Loyola Campus.
Future university campuses.
Building directory

Building names.
Building codes.
Addresses.
Campus association.
Available floors.
Relevant building information.
Indoor maps

Floor-by-floor maps.
Room labels.
Classroom search.
Facilities and amenities.
Elevators.
Staircases.
Entrances.
Washrooms.
Study areas.
Other useful destinations.
Room search workflow

Student searches for a room, for example EV 7.720.
ORBIT identifies the building and floor.
The correct floor map is displayed.
The room is highlighted.
The student can request directions.
Navigation workflow

Select starting point.
Select destination.
Determine the appropriate floor and building.
Calculate a route using verified navigation data.
Display directions.
Handle floor changes and building transitions.
Provide accessibility-aware alternatives when verified data supports them.
Technical requirements
Create a structured indoor navigation system.

Represent navigation using:

Navigation nodes.
Navigation edges.
Distances.
Floor relationships.
Connection types.
Accessibility metadata.
Verification status.
Use a suitable pathfinding algorithm such as Dijkstra or A*.

Separate the map-rendering layer from the navigation calculation engine.

The map renderer should be replaceable without rewriting the routing logic.

Critical limitation
Do not pretend that complete indoor navigation is available before obtaining accurate floor plans, room coordinates, and verified walking paths.

Begin with a verified building dataset and expand progressively.

A map that displays accurate room locations is more valuable than a sophisticated but unreliable navigation system.

MODULE C — FRIENDS
Purpose
A social coordination system that helps students discover when their friends are available and coordinate university activities.

This is not intended to become another generic social media application.

The focus is practical coordination.

Core functionality
Profiles

Username.
Display name.
Profile image.
Optional biography.
University affiliation.
Relevant profile preferences.
Friend management

Search for students.
Send friend requests.
Accept or decline requests.
Remove friends.
Block users.
Manage requests.
Schedule sharing

Students must have explicit control over schedule visibility.

Permission levels:

Private: no schedule information shared.
Availability only: permitted free/busy information.
Full schedule: schedule information shared according to the owner’s settings.
Permissions must be revocable.

Availability engine

The system should:

Compare permitted schedules.
Identify overlapping free periods.
Find common availability.
Account for class times.
Account for relevant time zones.
Return useful meeting windows.
The system should avoid exposing full private schedules when only a shared free period is required.

Future features

Study groups.
Group availability.
Coordinated lunch plans.
Shared event planning.
Optional activity invitations.
MODULE D — CAMPUS LIVE
Purpose
A community-powered information system that gives students a better understanding of what’s happening around campus.

This module should provide practical information that students can act on.

Core functionality
Cafeteria queues

List participating food locations.
Display recent wait-time estimates.
Display queue conditions.
Allow students to submit observations.
Show report age.
Indicate confidence and reliability.
Study-space availability

Display known study locations.
Show student-reported availability.
Allow students to submit updates.
Distinguish between verified capacity data and community observations.
Crowd information

Busy locations.
Crowd-level reports.
Recent updates.
Location-based information.
Community reporting

Workflow:

Student selects a location.
Selects the report category.
Submits an observation.
Report is timestamped.
The system calculates its relevance and reliability.
Other students can view the report.
The report expires when it becomes outdated.
Reliability system
Reports should not be treated as equally reliable.

Consider:

Time since submission.
Agreement between independent reports.
Number of distinct contributors.
Repeated submissions.
Suspicious activity.
Expiration rules.
Display freshness and confidence honestly.

Do not label user-submitted estimates as official university data.

3. THE ORBIT DASHBOARD
3.1 Dashboard philosophy
The dashboard is the central experience of ORBIT.

It should not be a collection of four unrelated cards.

It should intelligently combine information from all four modules into a personalized university overview.

The student should understand three things almost immediately:

Where am I going?
Who is available?
What is happening around campus?
3.2 Dashboard components
A. Personalized greeting

Greeting based on local time.
Student display name.
Selected campus.
Search.
Notifications.
Profile access.
B. Next class

The most prominent dashboard component.

Display:

Course name.
Course code.
Start time.
Countdown.
Building.
Room.
Quick navigation action.
If there is no upcoming class, display an appropriate alternative rather than an empty card.

C. Today’s schedule

Upcoming classes.
Current class status.
Breaks.
Relevant schedule actions.
D. Campus Navigator preview

Relevant campus or building.
Quick room search.
Shortcut to directions.
Map preview when useful.
E. Friends availability

Friends currently available, when sharing permissions allow.
Next shared free period.
Quick coordination action.
F. Campus Live preview

Recent cafeteria reports.
Study-space updates.
Campus activity.
Report freshness.
G. Quick actions

Add class.
Import schedule.
Find a room.
Find friends.
Submit a campus report.
3.3 Dashboard intelligence
The dashboard should eventually use contextual information.

For example:

If the next class is in 20 minutes and located in a different building, prioritize the navigation action.

If the student has a two-hour break, show relevant available friends and nearby study-space information.

If the student has no upcoming classes, prioritize campus activity and personal schedule information.

This is the difference between a static dashboard and a useful university companion.

4. DESIGN SYSTEM AND VISUAL IDENTITY
4.1 Brand direction
The name is ORBIT.

The brand should communicate:

Connection.
Movement.
Discovery.
Organization.
Intelligence.
A unified university ecosystem.
The visual identity must be distinctive and recognizable.

Avoid making ORBIT look like a generic university administration portal.

4.2 Design philosophy
Target aesthetic:

Premium modern technology product + university utility + sophisticated minimalism.

The interface should feel carefully designed, calm, confident, and professional.

It should be comparable in visual quality to polished commercial applications.

Do not blindly copy another application’s interface.

Use existing products as references for quality and usability, not as templates to reproduce.

4.3 Visual direction
Recommended starting palette:

Deep charcoal: primary dark surfaces.
Warm off-white: primary light surfaces.
Restrained burgundy: brand accent.
Muted neutral greys: secondary information.
Subtle green: successful states.
Amber: warnings.
Red: errors and critical information.
These are starting directions, not final locked colors.

Create a complete token system for:

Colors.
Typography.
Spacing.
Border radii.
Shadows.
Elevation.
Icon sizing.
Animation timing.
Component states.
Support light and dark themes.

4.4 Interface principles
Clear information hierarchy.
Strong typography.
Consistent spacing.
Carefully designed cards.
Subtle motion.
Purposeful animations.
Excellent empty states.
Consistent iconography.
High-quality loading states.
Clear error states.
Accessible contrast.
Responsive layouts.
Avoid:

Excessive gradients.
Unnecessary glassmorphism.
Excessive rounded cards.
Random colors.
Inconsistent icons.
Decorative animations without purpose.
Overcrowded dashboards.
Generic AI-generated UI patterns.
4.5 Design components
Create reusable components, including:

Buttons.
Input fields.
Search bars.
Navigation bars.
Tab navigation.
Cards.
Profile components.
Schedule event blocks.
Status indicators.
Map markers.
Modal windows.
Bottom sheets.
Notifications.
Loading skeletons.
Empty states.
Error states.
All components should follow the same design system.

5. TECHNICAL ARCHITECTURE
5.1 Approved technology direction
The team intends to use:

Layer

Technology

Application framework

React Native

Development platform

Expo

Programming language

TypeScript

Backend platform

Supabase

Database

PostgreSQL

Authentication

Supabase Auth

File storage

Supabase Storage

Server-side operations

Supabase Edge Functions

Realtime

Supabase Realtime

Navigation

Expo Router

Data fetching

TanStack Query

Validation

Zod

Forms

React Hook Form

Local state

Zustand

Styling

NativeWind or another justified consistent styling solution

Mapping

React Native Maps or another evaluated mapping solution

Testing

Jest and React Native Testing Library

Version control

GitHub

The architecture review must verify compatibility between selected library versions, Expo, React Native, and the intended web deployment target.

Do not install every package automatically. Evaluate whether each is necessary.

5.2 Platform strategy
The product is intended to support:

iOS.
Android.
Web.
The team must make an explicit decision about the web implementation.

Evaluate:

Expo Web for a shared React Native-based application.
A separate Next.js frontend if web-specific requirements justify it.
Prioritize shared business logic, types, validation, API contracts, and design tokens.

Do not force identical UI components across platforms if doing so damages usability.

5.3 Architectural pattern
Use a modular monolith.

Do not introduce microservices for the MVP.

Organize the application into distinct functional modules while maintaining one coherent backend and shared data model.

Keep these responsibilities separate:

Presentation.
Business logic.
Data access.
Validation.
Authentication and authorization.
External integrations.
Do not put complex business logic directly inside screen components.

5.4 Proposed repository structure
orbit/
│
├── apps/
│   ├── mobile/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── dashboard/
│   │   │   ├── schedule/
│   │   │   ├── navigator/
│   │   │   ├── friends/
│   │   │   └── campus-live/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── providers/
│   │   └── assets/
│   │
│   └── web/
│       └── To be determined by platform architecture
│
├── packages/
│   ├── core/
│   │   ├── schedule/
│   │   ├── availability/
│   │   ├── navigation/
│   │   └── campus-live/
│   │
│   ├── types/
│   ├── validation/
│   ├── database/
│   ├── api/
│   ├── design-tokens/
│   └── config/
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   ├── seed.sql
│   └── config.toml
│
├── docs/
│   ├── architecture/
│   ├── database/
│   ├── api/
│   ├── product/
│   ├── design/
│   └── development/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .github/
│   └── workflows/
│
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .gitignore
└── README.md
The exact structure should be refined based on the selected web strategy and tooling.

5.5 Shared business logic
Business logic must be reusable wherever possible.

Examples:

calculateNextClass()
calculateScheduleConflicts()
calculateFreePeriods()
calculateSharedAvailability()
calculateNavigationRoute()
calculateReportConfidence()
These functions should have clearly defined inputs and outputs and be independently testable.

Do not duplicate important calculations across mobile, web, and backend implementations.

Security-sensitive calculations must still be enforced on trusted server-side infrastructure.

6. DATABASE ARCHITECTURE
Use PostgreSQL through Supabase.

Use UUID primary keys, foreign keys, appropriate constraints, indexes, and migrations.

All timestamps should be handled consistently, using UTC storage and appropriate local-time interpretation. The initial campus timezone should be America/Toronto.

6.1 Proposed entities
User system
profiles
student_settings
notification_preferences
Academic system
courses
course_sections
student_schedules
class_events
schedule_imports
Campus system
campuses
buildings
floors
rooms
campus_locations
navigation_nodes
navigation_edges
Social system
friendships
schedule_permissions
friend_groups
friend_group_members
Campus Live
campus_live_locations
live_reports
study_spaces
Platform system
notifications
external_data_syncs
audit_events
6.2 Important relationships
A user can own multiple schedules.
A schedule contains multiple class events.
A class event can reference a course and a campus room.
A building contains multiple floors.
A floor contains multiple rooms.
Navigation nodes belong to floors or appropriate shared navigation spaces.
Navigation edges connect navigation nodes.
A user can have multiple friendships.
A user can grant specific schedule permissions to accepted friends.
A campus live location can have multiple reports.
Reports can expire independently of their underlying locations.
Claude must produce a full entity relationship diagram before database implementation.

6.3 Database requirements
For every proposed table, define:

Purpose.
Columns.
Data types.
Primary keys.
Foreign keys.
Unique constraints.
Check constraints.
Indexes.
Relationships.
RLS policies.
Data retention requirements.
Do not create unnecessary tables or fields merely because they might be useful someday.

7. SECURITY AND PRIVACY
Security must be part of the original implementation, not something added before launch.

Mandatory requirements:

Enable RLS on every user-sensitive table.
Students must only access their own private information unless explicit permissions exist.
Friendships must have clear states and authorization rules.
Schedule permissions must be independently enforced.
Blocking must prevent inappropriate interactions.
Never expose private email addresses through public profile queries.
Never expose the Supabase service-role key to client applications.
Validate user-submitted data.
Restrict file upload types and sizes.
Use secure file storage policies.
Protect sensitive Edge Functions.
Rate-limit submissions where abuse is possible.
Maintain appropriate audit records for sensitive operations.
Plan for account deletion and data export.
Define retention and expiration policies for uploaded files and community reports.
Claude must generate an explicit security and RLS matrix.

8. EXTERNAL DATA AND INTEGRATIONS
ORBIT’s initial university target is Concordia.

Investigate the official Concordia Open Data API and available datasets.

Potentially useful resources include:

Course catalog.
Course sections.
Course schedules.
Library occupancy.
Library computer availability.
Library room information.
Campus and building maps.
However, do not assume that every required dataset is available.

Verify:

API access requirements.
Authentication.
Rate limits.
Data freshness.
Licensing.
Commercial usage permissions.
Available room and building information.
Whether indoor floor plans can legally be used.
Whether personal timetable synchronization is supported.
Create an integration adapter so Concordia-specific data formats do not become embedded throughout the application.

ORBIT must not imply official Concordia endorsement without authorization.

External data should have clear provenance and verification status.

9. DEVELOPMENT ROADMAP
The project must be implemented in controlled milestones.

MILESTONE 0 — Architecture approval
Before coding:

Confirm the product requirements.
Finalize the platform strategy.
Finalize the technical stack.
Define the repository structure.
Design the database.
Define API contracts.
Define security policies.
Identify external data dependencies.
Establish the MVP scope.
Establish team responsibilities.
Deliverables:

Product requirements document.
System architecture document.
Database ERD.
API contract specification.
Security plan.
Implementation roadmap.
Technical decision log.
MILESTONE 1 — Foundation
Implement:

Repository setup.
Expo and React Native configuration.
TypeScript configuration.
Supabase setup.
Authentication.
Database migrations.
Shared packages.
Design system foundation.
Navigation structure.
CI checks.
Initial deployment strategy.
Acceptance criteria:

Application launches.
Users can register and log in.
Authentication persists correctly.
Database connection works.
RLS is enabled and tested.
Shared packages compile.
A basic application shell is functional.
MILESTONE 2 — Profiles and dashboard shell
Implement:

Onboarding.
Profile creation.
Campus preference.
Settings.
Main navigation.
Dashboard layout.
Loading, error, and empty states.
Acceptance criteria:

New users can complete onboarding.
Profiles persist correctly.
Dashboard displays personalized information.
Navigation works across primary sections.
MILESTONE 3 — Schedule
Implement:

Manual class creation.
Calendar views.
Schedule editing.
Recurring events.
ICS import.
PDF/image import.
Import review.
Conflict detection.
Acceptance criteria:

Students can create a usable schedule.
Imported events are reviewed before saving.
Time-zone and recurrence cases are tested.
Dashboard updates from schedule data.
MILESTONE 4 — Navigator
Implement:

Campus directory.
Building directory.
Floor data.
Map display.
Room search.
Verified room coordinates.
Initial route engine.
Acceptance criteria:

Students can search for a verified room.
Correct building and floor are displayed.
Room locations match verified data.
Routes are only presented when supported by verified paths.
MILESTONE 5 — Friends
Implement:

Profile discovery.
Friend requests.
Friendship management.
Permission management.
Availability engine.
Dashboard integration.
Acceptance criteria:

Students can connect.
Sharing permissions are enforced.
Availability is correctly calculated.
Unauthorized schedule access is prevented.
MILESTONE 6 — Campus Live
Implement:

Campus locations.
Queue reports.
Crowd reports.
Study-space reports.
Expiration.
Confidence calculations.
Dashboard integration.
Acceptance criteria:

Students can submit reports.
Reports display their age.
Outdated reports expire.
Spam and repeated submissions are handled.
Results do not falsely imply official live data.
MILESTONE 7 — Integration and beta
Implement:

Full dashboard integration.
Cross-module workflows.
Performance optimization.
Security testing.
Responsive design.
Accessibility testing.
Error handling.
Beta deployment.
Acceptance criteria:

All four modules work together.
Core workflows work end-to-end.
No critical authorization vulnerabilities remain.
The application is usable on intended platforms.
Documentation and deployment procedures are complete.
10. DEVELOPMENT WORKFLOW AND TEAM RULES
10.1 Git workflow
Use GitHub and a consistent branching strategy.

Branches:

main: stable release.
develop: integration.
feature/name-of-feature: feature development.
fix/name-of-fix: bug fixes.
Commit conventions:

feat:
fix:
refactor:
test:
docs:
chore:
All significant changes should go through pull requests.

10.2 Feature development workflow
Every feature must follow:

Define the user story.
Define acceptance criteria.
Design the user interface.
Identify database requirements.
Define data contracts.
Implement validation.
Implement backend operations.
Implement frontend.
Integrate.
Test.
Review.
Merge.
Do not merge untested code directly into main.

10.3 Code quality requirements
Strict TypeScript.
Consistent naming.
Reusable components.
Modular services.
No unnecessary code duplication.
No secrets committed to GitHub.
No arbitrary database changes without migrations.
No unexplained dependencies.
No massive screen components containing all application logic.
Meaningful error handling.
Automated tests for important business logic.
Clear documentation for non-obvious decisions.
11. MVP SCOPE CONTROL
The first release must be ambitious in experience but disciplined in implementation.

Required for MVP
Authentication.
User profiles.
Schedule creation and management.
Schedule import.
Daily and weekly views.
Building directory.
Initial floor maps and room search.
Friend requests.
Schedule-sharing permissions.
Shared availability.
Basic cafeteria reports.
Basic study-space reports.
Personalized dashboard.
Responsive, polished interface.
Not required for MVP
Live GPS indoor positioning.
Complete navigation across every university building.
Official automatic student information system synchronization.
Full university-wide real-time occupancy.
Messaging platform.
Social media feed.
AI chatbot.
Gamification.
Complex recommendation engine.
Microservices.
Kubernetes infrastructure.
These may be considered later if justified.

12. QUALITY AND ACCEPTANCE STANDARDS
ORBIT must not be considered finished simply because screens exist.

Every feature must be evaluated against:

Functionality

Does it actually work?
Does it persist information?
Does it handle invalid inputs?
Does it behave correctly with real data?
Design

Is it visually consistent?
Is it intuitive?
Does it work on different screen sizes?
Are loading, empty, and error states handled?
Security

Can another user access private information?
Are permissions enforced server-side?
Are files protected?
Are authentication checks correct?
Performance

Are queries efficient?
Is unnecessary loading avoided?
Are lists and maps handled appropriately?
Are slow operations moved out of the interactive UI?
Reliability

Are important operations tested?
Are edge cases handled?
Can errors be recovered from?
Are data integrity constraints enforced?
13. INSTRUCTIONS TO CLAUDE
You are acting as ORBIT’s CTO, principal software architect, senior full-stack engineer, technical product manager, and implementation strategist.

Your responsibility is to transform this blueprint into a detailed, technically sound implementation specification that a student development team can execute.

You must approach this as a serious software product, not a small demonstration project.

Your first responsibility: ARCHITECTURE, NOT CODING
Do not immediately generate the entire application.

Do not start creating screens, components, migrations, or implementation code before the architecture has been reviewed and approved.

First analyze the entire blueprint.

Identify:

Architectural inconsistencies.
Missing requirements.
Technical risks.
Unnecessary complexity.
Missing dependencies.
Data-model weaknesses.
Security concerns.
Platform compatibility problems.
Unverified external dependencies.
Features that should be delayed.
Challenge decisions when there is a technically stronger alternative. Explain your reasoning rather than blindly agreeing with everything.

Required deliverables
Produce the following documents in Markdown.

01 — PRODUCT_REQUIREMENTS.md
Complete product specification, users, use cases, user stories, feature requirements, priorities, and acceptance criteria.

02 — SYSTEM_ARCHITECTURE.md
Architecture diagram, platform strategy, technology choices, module boundaries, services, data flow, and integration architecture.

03 — DATABASE_SCHEMA.md
Complete relational schema, table definitions, relationships, constraints, indexes, migration strategy, and ERD.

04 — SECURITY_ARCHITECTURE.md
Authentication, authorization, RLS policies, permissions, storage security, abuse prevention, and privacy requirements.

05 — API_SPECIFICATION.md
All important application operations, input/output contracts, validation, error handling, and authorization requirements.

06 — DESIGN_SYSTEM.md
Visual identity, design principles, colors, typography, spacing, components, responsive rules, and interaction standards.

07 — IMPLEMENTATION_ROADMAP.md
Milestones, dependencies, task breakdown, priorities, estimated complexity, acceptance criteria, and recommended development order.

08 — REPOSITORY_STRUCTURE.md
Final folder structure, package responsibilities, naming conventions, and development tooling.

09 — TESTING_STRATEGY.md
Unit, integration, security, end-to-end, and cross-platform testing.

10 — TECHNICAL_DECISIONS.md
A decision log explaining major architectural choices and their alternatives.

Additional requirements
Use current official documentation when evaluating technology compatibility.
Do not invent Concordia API capabilities.
Clearly distinguish verified information from assumptions.
Avoid unnecessary infrastructure.
Prioritize maintainability and security.
Make all architecture decisions explicit.
Ensure modules share standardized data models.
Identify dependencies before assigning parallel work.
Estimate complexity realistically.
Make the plan executable by a student development team with mixed experience.
How to work with the team
Work in stages.

First deliver:

Architecture assessment.
Missing-information list.
Recommended technical decisions.
Initial repository structure.
Implementation dependencies.
Then produce the complete documentation set.

Present important unresolved decisions to the team instead of silently making assumptions.

After the team approves the architecture, move into implementation.

During implementation:

Work in small, verifiable increments.
Explain commands before asking the team to run them.
Keep files organized.
Avoid replacing existing work without inspecting it.
Test every important change.
Maintain documentation.
Never claim something works without verifying it.
The goal is not to generate the most code as quickly as possible.

The goal is to establish a professional foundation that allows ORBIT to become a reliable, polished, scalable product.

FINAL PRODUCT STANDARD
ORBIT should feel like a product that could genuinely be launched, adopted, and expanded beyond its initial university.

It should be technically disciplined, visually distinctive, privacy-conscious, and genuinely useful.

The four modules must not feel like separate projects.

They must operate as one connected ecosystem.

ORBIT — Your university, in one orbit.