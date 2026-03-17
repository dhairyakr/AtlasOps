# AtlasOps

> A comprehensive AI intelligence platform with 15+ specialized modes for research, analysis, voice agents, and cutting-edge AI experimentation.

---

## What is AtlasOps?

AtlasOps is a comprehensive, next-generation AI intelligence platform designed for enterprises, researchers, and AI practitioners who need more than just a simple chatbot. It's a unified workspace where conversational AI, advanced research capabilities, voice interaction, and cutting-edge AI experimentation all converge.

Think of it as a Swiss Army knife for AI—combining multiple specialized tools into one cohesive environment:
- **Talk to AI models** with natural language or voice
- **Research the web** with autonomous intelligent agents
- **Analyze documents** using retrieval-augmented generation (RAG)
- **Experiment with AI** through dedicated research labs
- **Gather intelligence** using OSINT and reconnaissance tools
- **Process financial documents** with specialized validators
- **Manage knowledge** with memory synthesis and knowledge graphs

Whether you're a data analyst gathering market intelligence, a researcher conducting document analysis, a developer building AI applications, a security professional conducting investigations, or an enterprise looking for comprehensive AI capabilities, AtlasOps provides the tools needed.

## Overview

AtlasOps is built with modern web technologies (React, TypeScript, Vite) and integrates with leading AI providers (Google Gemini, Groq) and services (Serper for web search, Supabase for data persistence). It delivers sophisticated tools for enterprise intelligence, academic research, and AI development—all in one intuitive, responsive interface.

### Key Highlights

- **15+ Specialized Modes & Labs** for different AI use cases
- **Multi-LLM Support** - Seamlessly switch between Gemini, Groq, and other providers
- **Voice-First Interface** - Full voice input/output capabilities with transcription
- **Web Intelligence** - Real-time web search integration for current information
- **Enterprise Analysis** - Term sheet validation, financial document processing
- **AI Research Labs** - Prompt engineering, fine-tuning, embeddings, ethics labs
- **Intelligence Modules** - Atlas (signals), Axon (memory), OSINT (reconnaissance)
- **Persistent Storage** - Supabase integration for chat history, sessions, and data
- **Advanced UI/UX** - Grain gradients, particle effects, responsive design

---

## Table of Contents

1. [Features](#features)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Getting Started](#getting-started)
6. [Core Modes](#core-modes)
7. [AI Labs](#ai-labs)
8. [Intelligence Modules](#intelligence-modules)
9. [Development](#development)
10. [Security & Best Practices](#security--best-practices)
11. [Troubleshooting](#troubleshooting)
12. [Contributing](#contributing)

---

## Features

### Core Conversation Modes

| Mode | Description |
|------|-------------|
| **Enhanced Chat** | Full-featured conversational AI with real-time responses and conversation history |
| **Voice Assistant** | Hands-free voice input and AI-generated audio responses |
| **Hybrid Mode** | Combines text and voice in a unified interface |
| **Web Agent** | Autonomous agent that browses and analyzes the web |
| **OutboundVoice Agent** | Voice calling and conversation management |
| **Term Sheet Validator** | Analyze and validate financial term sheets with AI insights |

### AI Laboratories

Advanced experimentation environments for AI research and development:

- **RAG Lab** - Retrieval Augmented Generation with document ingestion
- **Prompt Engineering Lab** - Design, test, and optimize prompts
- **AI Agents Lab** - Build and test autonomous agent pipelines
- **Fine-Tuning Lab** - Experiment with model fine-tuning techniques
- **Embeddings Lab** - Create and analyze vector embeddings
- **AI Ethics Lab** - Evaluate model behavior and ethical considerations
- **Multimodal Lab** - Work with images, text, and audio together

### Intelligence Modules

Specialized tools for reconnaissance and analysis:

- **Atlas Intelligence** - Global signals, trends, and market intelligence
- **Axon Exocortex** - Memory synthesis and knowledge graphs
- **OSINT Suite** - Open-source intelligence gathering and reconnaissance

---

## Prerequisites

### System Requirements

- **Node.js**: 18.0 or higher
- **npm**: 9.0 or higher (or yarn/pnpm)
- **Modern Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

### API Keys & Services

You'll need the following to use all features:

1. **LLM Provider** (choose at least one):
   - [Google Gemini API](https://ai.google.dev) - Recommended
   - [Groq API](https://console.groq.com) - High-speed inference

2. **Web Search** (optional):
   - [Serper API](https://serper.dev) - For web search capabilities

3. **Database**:
   - [Supabase Account](https://supabase.com) - For persistent storage (automatically configured)

4. **Voice/Audio** (optional):
   - Text-to-speech and speech-to-text capabilities require API configuration

### Supabase Setup

A Supabase project is automatically provisioned for you. The connection details are available in your `.env` file. No additional database setup is required.

---

## Installation

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd project
npm install
```

### 2. Create Environment File

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Or manually create `.env` with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GROQ_API_KEY=your_groq_api_key
VITE_SERPER_API_KEY=your_serper_api_key
```

### 3. Configure API Keys

See the [Configuration](#configuration) section below for detailed setup instructions for each API.

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

---

## Configuration

### API Key Setup

#### Google Gemini API

1. Visit [Google AI Studio](https://ai.google.dev)
2. Click "Get API Key" in the left navigation
3. Create a new API key
4. Add to your `.env` file:
   ```
   VITE_GEMINI_API_KEY=your_key_here
   ```

#### Groq API

1. Go to [Groq Console](https://console.groq.com)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Add to your `.env` file:
   ```
   VITE_GROQ_API_KEY=your_key_here
   ```

#### Serper API (for web search)

1. Visit [Serper.dev](https://serper.dev)
2. Sign up and verify your email
3. Generate an API key from your dashboard
4. Add to your `.env` file:
   ```
   VITE_SERPER_API_KEY=your_key_here
   ```

#### Supabase Connection

Your Supabase credentials are pre-configured:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These are automatically set up. No additional configuration needed.

### LLM Provider Selection

In the app, use the **Provider Selector** to switch between:
- Google Gemini (best for complex reasoning)
- Groq (best for speed)

The selected provider persists across sessions.

### Voice Configuration

Voice features require:
- Microphone access (granted via browser permissions)
- Audio output capability
- Supported in modern browsers (Chrome, Firefox, Safari, Edge)

---

## Getting Started

### First Time Setup

1. **Start the application**: `npm run dev`
2. **Enter API Keys**: The app will prompt you to configure at least one LLM API key
3. **Select a Mode**: Choose from the mode selector to begin
4. **Explore Features**: Each mode has built-in guidance and examples

### Quick Start Guide

#### Using Enhanced Chat

1. Select "Enhanced Chat" from the mode selector
2. Type your question or prompt
3. View responses with full formatting support
4. Chat history is automatically saved

#### Using Voice Assistant

1. Select "Voice Assistant"
2. Click the microphone icon
3. Speak your question (speech is transcribed automatically)
4. Listen to the AI-generated audio response
5. Conversation history is maintained

#### Using RAG Lab

1. Select "RAG Lab"
2. Upload documents (PDF, DOCX, XLSX)
3. Ask questions about the document content
4. View relevant excerpts and AI analysis

#### Using Web Agent

1. Select "Web Agent"
2. Enter a research task or question
3. Watch the agent autonomously browse and gather information
4. Review collected results and analysis

---

## Core Modes

### Enhanced Chat Interface

Conversational AI with persistent history and multi-turn support.

**Features:**
- Real-time streaming responses
- Conversation history with search
- Multiple conversation threads
- Copy, regenerate, and edit messages
- Markdown rendering with syntax highlighting

### Voice Assistant

Hands-free AI interaction with speech recognition and synthesis.

**Features:**
- Real-time speech-to-text
- AI-generated audio responses
- Voice transcription display
- Conversation history with audio
- Adjustable voice settings

### Hybrid Mode

Combined text and voice interface for flexible interaction.

**Features:**
- Toggle between text and voice input
- Unified conversation view
- Seamless mode switching

### Web Research Agent

Autonomous agent that searches and analyzes the web.

**Features:**
- Autonomous web browsing
- Information synthesis
- Source attribution
- Multi-step research tasks

### OutboundVoice Agent

Voice calling and conversation capabilities.

**Features:**
- Phone number dialing
- Live call transcription
- Call history tracking
- Recording and analysis

### Term Sheet Validator

Financial document analysis and validation.

**Features:**
- Document upload and parsing
- Financial term extraction
- Comparison mode for multiple documents
- Analysis and recommendations
- Risk assessment

---

## AI Labs

### RAG Lab - Retrieval Augmented Generation

**Purpose:** Build systems that retrieve relevant information from documents and generate contextual responses.

**Capabilities:**
- Upload multiple document formats (PDF, DOCX, XLSX)
- Create vector embeddings from document content
- Semantic search across documents
- Context-aware question answering
- Document management and organization

**Use Cases:**
- Customer support knowledge bases
- Research document analysis
- Corporate policy Q&A
- Technical documentation chatbots

### Prompt Engineering Lab

**Purpose:** Design, test, and optimize prompts for different use cases.

**Capabilities:**
- Prompt template creation
- Multi-variable prompt testing
- Response comparison
- Optimization suggestions
- Performance metrics

**Use Cases:**
- Developing system prompts
- Fine-tuning assistant behavior
- Testing prompt variations
- Performance benchmarking

### AI Agents Lab

**Purpose:** Build and experiment with autonomous agent architectures.

**Capabilities:**
- Agent pipeline design
- Tool/function integration
- Agent behavior tuning
- Step-by-step execution visualization
- Result analysis

**Use Cases:**
- Autonomous task execution
- Multi-step problem solving
- Agent orchestration
- Workflow automation

### Fine-Tuning Lab

**Purpose:** Experiment with model fine-tuning for specialized tasks.

**Capabilities:**
- Dataset preparation
- Fine-tuning configuration
- Model training visualization
- Performance evaluation
- Model export and deployment

**Use Cases:**
- Domain-specific model adaptation
- Specialized task training
- Quality improvement
- Cost optimization

### Embeddings Lab

**Purpose:** Create and analyze vector embeddings for semantic understanding.

**Capabilities:**
- Text-to-embedding conversion
- Similarity analysis
- Embedding visualization
- Batch processing
- Vector store management

**Use Cases:**
- Semantic search implementation
- Recommendation systems
- Clustering and classification
- Document similarity

### AI Ethics Lab

**Purpose:** Evaluate and assess model behavior for ethical considerations.

**Capabilities:**
- Bias detection
- Fairness metrics
- Safety assessment
- Responsible AI evaluation
- Compliance checking

**Use Cases:**
- Model evaluation
- Risk assessment
- Compliance verification
- Responsible AI implementation

### Multimodal Lab

**Purpose:** Work with images, text, and audio together.

**Capabilities:**
- Image understanding
- Audio transcription
- Cross-modal analysis
- Feature extraction
- Multi-format processing

**Use Cases:**
- Image recognition
- Audio analysis
- Document OCR
- Multi-modal understanding

---

## Intelligence Modules

### Atlas Intelligence

Real-time signals and intelligence about markets, entities, and events.

**Features:**
- Signal feed with global coverage
- Watchlist management
- Intelligence briefings
- Country-level analysis
- Trend identification
- Interactive world map visualization

**Use Cases:**
- Market intelligence
- Competitor monitoring
- Risk assessment
- Geopolitical analysis

### Axon Exocortex

Memory synthesis and knowledge management system.

**Features:**
- Semantic memory capture
- Knowledge graph visualization
- Pattern recognition
- Memory search and retrieval
- Synthesis and insights

**Use Cases:**
- Knowledge management
- Research synthesis
- Pattern discovery
- Decision support

### OSINT Suite

Open-source intelligence gathering and reconnaissance.

**Features:**
- Target profile creation
- Multi-platform reconnaissance
- Investigation panels
- Timeline analysis
- Report generation
- Dork query generation

**Capabilities:**
- Social media monitoring
- Domain reconnaissance
- Email discovery
- Infrastructure analysis
- Threat intelligence

**Important:** OSINT capabilities should be used responsibly and legally. Only investigate targets you have authorization to research. Respect privacy laws and regulations in your jurisdiction.

**Use Cases:**
- Threat intelligence
- Due diligence investigations
- Competitive intelligence
- Security research

---

## Development

### Project Structure

```
project/
├── src/
│   ├── components/           # React components
│   │   ├── rag/             # RAG Lab components
│   │   ├── promptLab/       # Prompt Lab components
│   │   ├── agentsLab/       # Agents Lab components
│   │   ├── atlas/           # Atlas Intelligence components
│   │   ├── axon/            # Axon Exocortex components
│   │   ├── osint/           # OSINT Suite components
│   │   └── ...              # Other mode components
│   ├── services/            # External API integrations
│   │   ├── llmService.ts    # LLM provider abstraction
│   │   ├── ragService.ts    # RAG operations
│   │   ├── webSearchService.ts
│   │   └── ...
│   ├── contexts/            # React Context providers
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── data/                # Static data
│   └── App.tsx              # Main app component
├── supabase/
│   ├── migrations/          # Database migrations
│   └── functions/           # Edge Functions
├── public/                  # Static assets
└── package.json
```

### Key Services

**LLM Service** (`src/services/llmService.ts`)
- Unified interface for multiple LLM providers
- Provider abstraction and fallback logic

**RAG Service** (`src/services/ragService.ts`)
- Document ingestion and processing
- Vector embedding generation
- Semantic search functionality

**Web Search Service** (`src/services/webSearchService.ts`)
- Serper API integration
- Search result retrieval and formatting

**Supabase Client** (`src/services/supabaseClient.ts`)
- Database and authentication
- Session management

### Build and Deploy

**Development:**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
```

**Preview Build:**
```bash
npm run preview
```

**Code Quality:**
```bash
npm run lint
```

### Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Vite 5** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **Supabase** - Backend & database
- **GSAP** - Advanced animations
- **Lucide React** - Icon library
- **React Markdown** - Markdown rendering

### Adding New Features

1. **Create Component**: Add new component in appropriate folder under `src/components/`
2. **Add Types**: Define types in `src/types/` if needed
3. **Create Service**: Add API integration in `src/services/` if required
4. **Register Mode**: Update `ModeSelector` and `App.tsx` for new modes
5. **Test Locally**: Run `npm run dev` and test thoroughly
6. **Build Check**: Run `npm run build` to verify production build

---

## Security & Best Practices

### API Key Management

**Critical Security Warning:**

- Never commit `.env` files to version control
- Never hardcode API keys in source code
- Rotate API keys regularly
- Use environment variables for all sensitive data
- Monitor API usage for unusual activity

**Best Practices:**
1. Generate separate API keys per environment
2. Set API key restrictions in provider dashboards
3. Store keys only in `.env` (local development)
4. Use secrets management for production
5. Audit API key access and usage

### Authentication & Authorization

- **Supabase Auth** handles user authentication
- Sessions are stored securely in browser
- Row-Level Security (RLS) policies protect database data
- Each user can only access their own data

### Data Privacy

- Chat history is stored in Supabase
- Only authenticated users can access their data
- Consider GDPR/CCPA implications for data retention
- Implement data deletion policies as needed

### Responsible AI Use

- **OSINT Module**: Only investigate targets you have authorization to research
- **Voice Features**: Respect privacy and consent when recording
- **Web Agent**: Respect robots.txt and website terms of service
- **Model Outputs**: Verify AI-generated content accuracy before use
- **Bias Awareness**: Be aware of potential AI model biases

---

## Troubleshooting

### Common Issues

#### "API Key Not Configured"

**Solution:**
1. Verify `.env` file exists in project root
2. Check that at least one LLM API key is set
3. Restart the development server (`npm run dev`)
4. Clear browser cache and reload

#### Voice Not Working

**Solution:**
1. Check browser permissions for microphone access
2. Test microphone in browser settings
3. Verify browser supports Web Audio API
4. Try a different browser if available

#### Documents Not Uploading

**Solution:**
1. Check file format (PDF, DOCX, XLSX supported)
2. Verify file size is reasonable
3. Check browser console for error messages
4. Try uploading a different document type

#### Chat History Not Saving

**Solution:**
1. Verify Supabase connection (check .env)
2. Check browser localStorage quota
3. Clear browser cache and reload
4. Check network tab in browser dev tools

#### Build Fails with Type Errors

**Solution:**
```bash
npm run lint
npm run build
```

Review error messages and ensure all types are properly defined.

#### Performance Issues

**Solution:**
1. Check browser for too many open tabs/windows
2. Clear browser cache and local storage
3. Restart development server
4. Update Node.js to latest stable version

### Getting Help

1. Check browser console for error messages (F12)
2. Review network tab for failed requests
3. Verify all API keys are correctly set
4. Check Supabase project status dashboard

---

## Contributing

We welcome contributions! Please follow these guidelines:

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Use Tailwind CSS for styling
- Keep components focused and reusable
- Add meaningful comments for complex logic

### Commit Messages

- Use clear, descriptive commit messages
- Reference issues when applicable
- Keep commits atomic and focused

### Pull Requests

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and commit
3. Push to your fork
4. Open a pull request with description

### Reporting Issues

When reporting issues, include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information
- Error messages from console

---

## License

This project is provided as-is for research and development purposes.

## Acknowledgments

Built with cutting-edge technologies and designed for maximum productivity and AI experimentation.

---

**Questions? Issues? Ideas?**

For support and inquiries, refer to the troubleshooting section or check the project repository for contact information.

---

**Last Updated:** March 2025
