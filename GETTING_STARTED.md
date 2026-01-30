# Getting Started with PIPAPP

This guide will help you set up and run your app.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file and add your keys
cp .env.example .env

# Start the development server
npm start
```

## Environment Setup

Copy `.env.example` to `.env` and fill in the required values:

### Local Storage

Your app uses local AsyncStorage for data persistence.
No cloud configuration is required.

> **Note:** Data is stored on-device only. Users cannot sync
> across devices, and data is lost when the app is uninstalled.

### AI Chat Configuration

Your app includes the Chat feature with AI integration.

> **⚠️ Security Warning:** API keys are exposed client-side in
> React Native apps. For production, implement a backend proxy
> to keep your keys secure.

Get API keys for your selected providers:

- **OpenAI**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Anthropic**: [https://console.anthropic.com/](https://console.anthropic.com/)

Add the keys to your `.env` file:

```
EXPO_PUBLIC_OPENAI_API_KEY=your-api-key
EXPO_PUBLIC_ANTHROPIC_API_KEY=your-api-key
```

## Your App Features

Based on your selections, your app includes:

- **Local Storage** - On-device data persistence
- **Chat** - AI-powered chat interface with LLM integration
- **Scheduler** - Recurring tasks and reminder management
- **Questionnaires** - FHIR-compliant health forms

## Running on Devices

```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web Browser
npm run web
```

## Project Structure

```
├── app/              # Expo Router screens
│   ├── (tabs)/       # Bottom tab screens
│   └── questionnaire/# Health form screens
├── packages/         # Shared modules
│   └── chat/         # AI chat functionality
│   └── scheduler/    # Task scheduling
│   └── questionnaire/# FHIR forms
├── lib/              # App utilities
└── components/       # Reusable UI components
```

## Learn More

- [Expo Documentation](https://docs.expo.dev)
- [Expo Router](https://expo.github.io/router/docs)
- [React Native](https://reactnative.dev)
