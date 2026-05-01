# ZenNote

A minimal, secure, and real-time collaborative note-taking application built with React, Tiptap, and Firebase.

## Features

- **Real-time Collaboration**: Edit notes with others simultaneously with live cursor and presence indicators.
- **Private & Public Notes**: Keep your thoughts private or share them with a public link.
- **Modern Editor**: A distraction-free writing experience with a floating menu, bubble menu, and slash commands.
- **Mobile Optimized**: Ergonomic mobile toolbar and responsive sidebar for the best experience on all devices.
- **Security First**: Granular Firestore rules ensuring private stay private.
- **Themes**: Beautiful light and dark modes.
- **Offline Ready**: Robust authentication and data handling.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **Editor**: Tiptap (Headless rich-text editor)
- **Backend**: Firebase Authentication, Firestore
- **State Management**: React Hooks & Context API
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js (v18+)
- Firebase Project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file or use the platform's secret manager for:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

4. Run the development server:
   ```bash
   npm run dev
   ```

## Security & Privacy

ZenNote uses a "Master Gate" pattern for Firestore rules. Private notes only allow access to the owner. When a note is switched to "Public", a confirmation dialog explains the implications before updating the sharing status.

## License

MIT © ZenNote
