*This project has been created as part of the 42 curriculum by lusavign, gougier, rribette, phillebr.*

# Transcendence

## Description

**Transcendence** is a full-stack web application built around a real-time multiplayer Pokemon game, featuring user authentication, live chat, and much more(Detailed below)... The project is fully containerized and served over HTTPS.

The goal of the project is to design and build a complete single-page web application with a secure backend API, a modern reactive frontend, real-time features over WebSockets, and a robust infrastructure — all running in isolated containers.

### Key features

- **User authentication**: classic registration/login (username + password) and OAuth login via **42** and **Google**.
- **JWT-based session management** with access and refresh tokens.
- **User profile management**: editable display name, biography, and avatar upload.
- **Friend system**: send, accept, and reject friend requests; manage a friend list.
- **Real-time game**: a turn-based battle game with Pokemon assets.
- **Real-time chat** between users over WebSockets.
- **Fully served over HTTPS** through an Nginx reverse proxy.

## Instructions

### Prerequisites

Before running the project, make sure you have the following installed:

- **Docker** and **Docker Compose** (or **Podman** with `podman-compose`, used rootless on Fedora)
- Available ports: `8443` (HTTPS) and `8080` (HTTP redirect) on the host machine

### Environment configuration

The project relies on a `.env` file at the root of the repository. Create it (or copy the provided example and modify it).

Same thing for the `frontend/.env`


> **Note on OAuth redirect URIs:** the redirect URIs configured on the 42 intra and Google Cloud Console must match the URL used to access the app. By default this is `https://localhost:8443/auth/42/callback` and `https://localhost:8443/auth/google/callback`. Google does not accept private IP addresses as redirect URIs, so Google OAuth only works from `localhost`.

### Get the Project running

```bash
git clone git@github.com:Gosushi3/Ft_transcendence.git name_of_the_repo
```

```bash
cd name_of_the_repo
```

From the root of the repository:

```bash
make
```

This will:
1. Build the backend, frontend, and Nginx images.
2. Start PostgreSQL and Redis.
3. Apply database migrations automatically.
4. Set up the OAuth social application configuration.
5. Launch the development servers behind the Nginx reverse proxy.

Once running, open your browser at:

```
https://localhost:8443
```

> The project uses a **self-signed SSL certificate**, so your browser will display a security warning on first access. This is expected — click "Advanced" → "Proceed" to continue.

To stop the project:

```bash
make down
```

To stop and wipe all data (database, volumes):

```bash
make fclean
```

## Team Information

| Member | Login | Role(s) | Responsibilities |
|--------|-------|---------|------------------|
| phillebr | [Developer] | [Game implementation] | Write code for assigned features, participate in code reviews, test implementations, document work.
| lusavign | [Tech Lead/ Developer] | [Backend API, chat, Accessibility and Internationalization] | Validates completed work, Makes decisions on features and priorities.
| rribette | [Product Owner/ Developer] | Frontend UI/UX | Makes decisions on features and priorities, Validates completed work
| gougier | [Project Manager/ Developer] | [Authentication, backend API, infrastructure] | Organizes team meetings and planning sessions. Tracks progress and deadlines. Ensures team communication. Manages risks and blockers.

## Project Management

### Work organization

The team divided the work along functional lines: authentication, game logic, chat, frontend/UI. Tasks were distributed during regular sync meetings, and each member owned specific features end-to-end (backend + frontend).

### Tools used

- **Version control**: Git / GitHub (repository: `Gosushi3/Ft_transcendence`)
- **Project management**: in-person at 42, shared document on discord
- **Communication**: Discord, in-person at 42

### Branching strategy

Each developer worked on their own branch, created a Pull Request and merged into the main branch after review.

## Technical Stack

### Frontend

- **React** with **TypeScript** — component-based reactive UI.
- **Vite** — fast development server and build tool.
- **Tailwind CSS** — utility-first styling.
- **React Router** — client-side routing for the single-page application.

### Backend

- **Django** with **Django REST Framework (DRF)** — REST API.
- **Django Channels** with **Daphne** (ASGI) — WebSocket support for real-time features.
- **djangorestframework-simplejwt** — JWT authentication.
- **django-allauth / dj-rest-auth** — Google OAuth integration.

### Database

- **PostgreSQL** — chosen for its robustness, reliability, and strong support for relational data and complex queries. It integrates natively with Django's ORM and handles the relational structure of users, friend requests, and game data well.

### Infrastructure

- **Nginx** — reverse proxy terminating HTTPS and routing requests to the frontend and backend.
- **Redis** — message broker / channel layer backing the WebSocket (Django Channels) features.
- **Docker / Podman** — containerization (rootless Podman on Fedora).

### Justification for major technical choices

- **Django + DRF**: mature, batteries-included framework with a powerful ORM, built-in admin, and a rich ecosystem for authentication and API building.
- **React + TypeScript**: industry-standard for reactive UIs; TypeScript adds type safety.
- **JWT (stateless)**: allows authentication without server-side session storage, which simplifies scaling and survives server restarts.
- **Nginx reverse proxy**: centralizes HTTPS termination and lets the frontend and backend share a single origin, avoiding CORS complications.
- **Self-signed certificate**: satisfies the HTTPS requirement in a development/evaluation context without needing a domain.

## Database Schema

### Main tables

**User** (custom, extends Django's `AbstractUser`)

| Field | Type | Notes |
|-------|------|-------|
| id | Integer | Primary key |
| username | CharField | Unique |
| email | EmailField | Unique — used as the identity key for OAuth |
| password | CharField | Hashed (empty for OAuth-only users) |
| display_name | CharField | Defaults to username if blank |
| bio | TextField | Optional |
| avatar | ImageField | Uploaded to `media/images_avatar/` |
| email_verified | BooleanField | |
| friends | ManyToManyField (self) | Symmetrical relationship |
| date_joined | DateTimeField | |

**Friend_Request**

| Field | Type | Notes |
|-------|------|-------|
| id | Integer | Primary key |
| from_user | ForeignKey → User | The sender |
| to_user | ForeignKey → User | The recipient |


### Relationships

- **User ↔ User** via `friends` — a symmetrical many-to-many relationship: if A is friends with B, then B is automatically friends with A.
- **Friend_Request → User** — two foreign keys (`from_user`, `to_user`) representing the direction of a pending request.

## Modules

> Major = 2 points, Minor = 1 point.

| Module | Type | Points | Description / Implementation | Contributor(s) |
|--------|------|--------|------------------------------|----------------|
| WEB — Use a framework for both the frontend and backend. | Major | 2 | Django + React | Rribette
| WEB — Implement real-time features using WebSockets or similar technology. | Major | 2 | Django Channels + Redis | Lusavign, Rribette
| WEB — Allow users to interact with other users. | Major | 2 | Django Channels + Redis | Lusavign |
| WEB — Use an ORM for the database | Minor | 1 | Django ORM| gougier |
| Accessibility and Internationalization — Support for additional browsers.| Minor | 1 | | gougier, Lusavign, Rribette, Phillebr |
| User Management — Standard user management and authentication | Major | 2 | Custom user model, JWT| gougier, Rribette, Lusavign |
| User Management — Implement remote authentication with OAuth 2.0 | Minor | 1 | 42 (manual authorization-code exchange) & Google OAuth (via django-allauth)| gougier |
| Artificial Intelligence — Introduce an AI Opponent for games | Major | 2 | The AI must be challenging and able to win occasionally. | phillebr |
| Gaming and user experience — Implement a complete web-based game where users can play against each other | Major | 2 | Pokemon battle with assets, attacks, types, lifebar | phillebr |
| Gaming and user experience —  Remote players | Major | 2 | Provide a smooth user experience for remote gameplay. | phillebr |
| Gaming and user experience — Advanced chat features | Minor | 1 | WebSockets via Django Channels + Redis | Lusavign |


**Total points: 18**

### Module justifications

- **Use a framework for both the frontend and backend:** Considering what we had planned for our website, it was necessary to have both a framework for the backend and frontend as we needed the website to have an appealing appearance and be interacted with by users, and store data in the backend.

- **Standard user management + OAuth**: Implemented a custom Django user model extending `AbstractUser`. We needed this because we wanted some fields that are not in the basic function. JWT authentication via simplejwt, witch is usefull because it is a pre made library, and OAuth flows for both 42 (manual authorization-code exchange)( because the code exists in 42 doc exemple in java and had to adapt it in python) and Google (via django-allauth). Users are uniquely identified by email, allowing the same account across login methods. Is online status with websockets was useful to know if a user logged out or not.

- **Allow users to interact with each other:** Because the whole project relies on the game section and the ability to play with other users, allowing users to have profiles and interact with one another felt like an important addition to the website.

- **Advanced chat features:** To make the website feel more organic for users, we thought adding features such as chat history persistence or abilities to block users was crucial. Allowing users to directly access other's profiles and invite them to play via chatrooms also makes the website easier to navigate.

- **Implement real-time features using WebSockets or similar technology:** This feature was necessary to efficiently set up elements such as chatrooms and gamerooms.

- **Use an ORM for the database:** Django's ORM (Object Relational Mapper) makes communication to database tables easier as it is in python and removes the need to manually write SQL requests, which is why it was used for this project.

- **Support for additional browsers:** Making the project work on different browsers only required minimal work with only some differences concerning warnings in console so it was decided to include this feature.

- **Implement a complete web-based game where users can play against each other:** This module was added to add interactability to the website. It was also decided that it would be an interesting and challenging task to take on .

- **Introduce an AI Opponent for games:** Since most games include AIs in some type of way, it was important to us to introduce this feature so that users could play on their own or mess around with the different possible team compositions without needing a gaming partner.

- **Remote players:** Similarly to the AI opponent feature, being able to play remotely is a huge component of modern gaming so it was decided to add this module to the project to see how it could be set up. We thought it would give a more polished aspect to the game and add real value to our project.

## Individual Contributions

### gougier

- Implemented the authentication system: classic login/register, JWT handling, and OAuth flows for both 42 and Google.
- Built the user profile management (display name, bio, avatar upload via FormData with backend `ImageField` validation).
- Finished the friend system after lusavign's work (/accept/reject requests, friend list) on both backend and frontend.
- Set up the HTTPS infrastructure with the Nginx reverse proxy and self-signed certificates on rootless Podman.
- Configured CORS, CSRF, and `ALLOWED_HOSTS` for cross-machine access.

**Challenges faced:**
- Cross-machine access required switching from hardcoded backend URLs to `window.location.origin` so the frontend adapts to whichever host accesses it.
- Handling the OAuth authorization code being single-use, which caused a 400 error due to React's StrictMode double-invoking effects — solved with a `useRef` guard.
- Managing the fragility of the Google `SocialApp` stored in the database (lost on volume wipe), solved with an automated setup script run at container startup.

### lusavign

- Set up a basic profile system for users to view information such as username, display name,...
- Handled the backend friend system so users could add or remove each other via requests, then created a friendlist.
- Added the option to block users, preventing them to send game invitations, friend requests or messages.
- Implemented (both in backend and frontend) a private chatroom system that allows logged users to send each other messages. From a chatroom page, users can send each other game invitations and directly access another user's profile page.
- Added a chat history feature so even after leaving a chatroom, previous messages are pulled from the database and are visible after accessing that chatroom again.
- Set up a typing indicator and read receipts in chatrooms.


**Challenges faced:**
- Exploiting Django Channels to create a system more akin to an actual private message system than a public chatroom one. Setting it up required a lot of testing to avoid room duplicates, unauthorized accesses and such.
- Introducing real-time effects to blocking a user, as blocked users were still able to send messages and invites if they didn't refresh the page.


### rribette

- Designed the overall look of the website.
- Wrote the frontend for most of the pages

**Challenges faced:**
- Get design to be reponsive including with growing lists ( FriendsList for example ) which included to create intermediate arrays
- Choosing which variables would be responsible to refreshing the display
- Understanding how size works in css with screen of varying size

### phillebr

- Implemented a real-time Pokemon-themed multiplayer game with communication between backend and frontend through WebSockets, allowing logged users to battle on another.
- Created an AI opponent that challenges the player and can either win or lose.
- Added local users to allowed hosts list to introduce the remote player features. Users can play from different computers as long as they are correctly accessing the website.

**Challenges faced:**
- Understanding and exploiting WebSockets
- Store all necessary data in a database for the game to work properly


## Resources

### Documentation and references

- [Django documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Simple JWT](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Django Channels](https://channels.readthedocs.io/)
- [PostgreSQL](https://neon.com/postgresql/getting-started/)
- [Authentification](https://thecopenhagenbook.com/csrf https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html/)
- [React documentation](https://react.dev/)
- [Vite documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [42 API — Web Application Flow](https://api.intra.42.fr/apidoc/guides/web_application_flow)
- [Google Identity / OAuth 2.0](https://developers.google.com/identity/protocols/oauth2 https://www.oauth.com/ https://api.intra.42.fr/apidoc/guides/specification https://api.intra.42.fr/apidoc/2.0/users/me.html https://dj-rest-auth.readthedocs.io/en/latest/getting-started/installation/#4-run-migrations https://github.com/iMerica/dj-rest-auth https://www.toptal.com/developers/django/integrate-oauth-2-into-django-drf-back-end)
- [Nginx documentation](https://nginx.org/en/docs/)
- [Django Channels documentation](https://channels.readthedocs.io/en/stable/index.html)


### Use of AI

AI assistants were used as a learning and debugging aid throughout the project, specifically for:
- Explaining concepts (JWT, OAuth flows, React hooks, CORS/CSRF, reverse proxy architecture).
- Debugging specific errors (CORS misconfigurations, OAuth code exchange failures, database-related 500 errors).
- Reviewing and suggesting improvements to backend views and React components.

All code was reviewed, understood, and adapted by the team. AI was used to help create this Makefile.

## Known Limitations

- Google OAuth only works when accessing the app via `localhost` (Google rejects private IP redirect URIs). Same thing for 42, the url callback being localhost and because we dont have a domain name, we couldnt put it. From the start we did not plan to turn this project in production mode so this is an assumed choice.
- The SSL certificate is self-signed, triggering a browser warning.

- The project has been created in dev mode settings and not production, wih full knowledge of the fact that the site purpose was not to be distributed and used by real clients.
