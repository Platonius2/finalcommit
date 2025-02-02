# FireCMS Demo Project

This is a simple HTML project with FireCMS integration.

## Setup Instructions

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Replace the Firebase configuration in `index.html` with your own configuration:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

## Running the Project

You can serve this project using any HTTP server. For example:
- Using Python: `python -m http.server 8000`
- Using Node.js: Install `http-server` globally (`npm install -g http-server`) and run `http-server`

## Important Notes

- Make sure to enable Authentication and Firestore in your Firebase project
- Configure proper security rules in your Firebase project
- The demo includes a basic "products" collection schema which you can modify according to your needs 