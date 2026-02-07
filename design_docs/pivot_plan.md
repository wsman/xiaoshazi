# Project Pivot: From MythicStats to AgentStats

**Objective**: Refactor the existing MythicStats DPS ranking project into an AI Agent Performance Leaderboard.

## 1. Domain Mapping (Concept Pivot)

| Original Concept (WoW) | New Concept (AI Agents) | Description | Example |
| :--- | :--- | :--- | :--- |
| **Class** | **Provider** | The AI company or organization. | OpenAI, Anthropic, Google, DeepSeek |
| **Spec** | **Model** | Representative models from the provider. | GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro |
| **DPS** | **Avg Perf** | Average performance score across tasks. | 85.4 (out of 100) |
| **Top 5%** | **Peak Capability** | Score on the most complex/hardest tasks. | 92.1 (out of 100) |
| **Tier** | **Tier** | S/A/B/C ranking based on performance. | S-Tier, A-Tier |
| **Dungeon** | **Scenario** | Real-life usage scenarios. | Coding, Creative Writing, Math, Logic |
| **Runs** | **Samples** | Number of benchmark samples or user ratings. | 12,500 |

## 2. Refactoring Plan

### Phase 1: Data Model (`server.js`)
- Rename API endpoint to `/api/agents`.
- Structure the mock data:
  ```json
  {
    "rank": 1,
    "diff": 0,
    "tier": "S",
    "model": "Claude 3.5 Sonnet",
    "provider": "Anthropic",
    "avgPerf": 88.5,
    "peakPerf": 94.2,
    "samples": 15420
  }
  ```

### Phase 2: Branding & Utilities (`client/src/utils/`)
- Rename `classColors.js` to `providerColors.js`.
- Define brand colors:
  - **OpenAI**: `#10a37f` (Green)
  - **Anthropic**: `#d97757` (Terracotta)
  - **Google**: `#4285F4` (Blue)
  - **Meta**: `#0668E1` (Facebook Blue)
  - **DeepSeek**: `#4ecca3` (Neon Cyan)
  - **Mistral**: `#fdb002` (Yellow)

### Phase 3: UI Components (`client/src/components/`)
- **App.jsx**: Update title to "AgentStats" and description to "AI Agent Performance Leaderboard".
- **DPSRankings.jsx** -> **AgentRankings.jsx**:
  - Update Filters: "All Scenarios", "Coding", "Writing" (instead of Dungeons).
  - Update Headers: "Model / Provider", "Performance (Avg / Peak)".
- **DPSBar.jsx** -> **PerfBar.jsx**:
  - Logic remains similar (Dual-layer bar), but semantic naming changes.

## 3. Library Integration (Tech Stack Expansion)

Based on the `departments/technology/library` assets, integrate the following advanced components to enhance the AgentStats project:

### A. RouteTransition.tsx (Enhanced UX)
- **Purpose**: Add smooth transitions when switching between Scenarios (Dungeons) or Timeframes.
- **Integration**: Wrap the `AgentRankings` table content in `<RouteTransition>` to create a fade/slide effect when filters change.

### B. ChartWorkerManager.ts (Performance)
- **Purpose**: If the dataset grows (e.g., 1000+ samples), use a Web Worker for sorting and filtering to keep the UI thread responsive.
- **Integration**: Offload the filtering logic (by Provider/Scenario) to this worker pattern.
- **Source**: `departments/technology/library/patterns/ChartWorkerManager.ts`

### C. EntropyDashboard.tsx / EntropyPriceDisplay.tsx (New Feature)
- **Adaptation**: Refactor these into a **"Cost/Efficiency Dashboard"**.
- **Concept**:
  - `Entropy` -> `Token Cost` (Input/Output price).
  - `PriceDisplay` -> `Cost per 1k Tokens`.
- **Placement**: Add a new "Economics" tab or section below the main leaderboard.
- **Source**: `departments/technology/library/components/ui/EntropyDashboard.tsx`

## 4. Execution Strategy
1. **Tech Minister** executes the refactor based on this plan.
2. **Library Import**: Copy and adapt the selected components from `departments/technology/library`.
3. **Verification**: Ensure the page reflects the AI domain clearly and uses the new components.
