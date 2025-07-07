# TurnEngine - Local-First Turn-Based Game Engine

## Vision
Build **TurnEngine**, a reusable, local-first game engine for turn-based strategy games, starting with WeeWar clone and expanding to Neptune's Pride and beyond.

## Core Principles
- **Local-first**: Game logic runs in browser, server only for persistence/sync
- **Minimal server costs**: Checkpointing and matchmaking only
- **Reusable engine**: 80% code reuse across different game types
- **Non-UI focused**: Engine handles game state, rules, networking - UI is game-specific

## Target Games
1. **WeeWar** (POC) - Hex-based tactical combat
2. **Neptune's Pride** - Real-time space conquest with diplomacy
3. **Future games** - Chess, Risk-like, abstract strategy

## Architecture Overview

### Core Systems
- **Game State Management** - Universal state representation
- **Entity Component System** - Flexible game object composition
- **Rule Engine** - Game-specific behavior configuration
- **Time Management** - Handle discrete turns and continuous time
- **Networking Layer** - Local-first with server sync
- **AI Framework** - Pluggable AI for different game types

### Technology Stack
- **Frontend**: Modern web (React/Vue/vanilla JS)
- **Backend**: Minimal server (Node.js/Python/Go)
- **Database**: Simple persistence (PostgreSQL/SQLite)
- **Storage**: JSON-based game states
- **Communication**: REST API + optional WebSockets

## Key Features
- **Offline play** with local AI
- **Async multiplayer** with friends
- **Premium server AI** for revenue
- **Spectator mode** for watching games
- **Replay system** from turn history
- **Fog of war** support
- **Flexible victory conditions**
