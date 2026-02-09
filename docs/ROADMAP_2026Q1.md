# AgentStats Evolution Roadmap (2026 Q1)

**Date**: 2026-02-08
**Status**: Pending Execution (Quota Limit Reached)
**Approved By**: 元首

---

## 1. Current Status (As of Feb 8, 2026 16:00)
- **Architecture**: Decoupled successfully.
    - Frontend: `:14514` (Static Serve)
    - Backend: `:3001` (Node API)
- **Scoring Engine**: 
    - Implemented **"Qwen-Specific" Algorithm**: `Score = Max(General, Reasoning, Coding) * VersatilityBonus`.
    - Implemented **Scenario-Based Weighting**: Dynamic penalties for non-specialized models in Coding/Reasoning views.
- **UI**: 
    - Framer Motion animations active.
    - Three-column layout with "Scrolling Economic Column".

---

## 2. Technology Integration Plan (The "Trinity" Upgrade)

We have identified 3 high-value assets from the Ministry of Science and Technology (MOST) library to integrate.

### Phase 1: Performance Core (ChartWorkerManager)
*   **Objective**: Offload heavy scoring and sorting logic from the Main Thread to a Web Worker.
*   **Source Asset**: `departments/technology/library/patterns/ChartWorkerManager.ts`
*   **Implementation Steps**:
    1.  Create `client/src/workers/scoring.worker.js`.
    2.  Extract the `calculateWeightedScore` and `sortAgents` logic from `AgentRankings.jsx`.
    3.  Implement a `useWorker` hook to communicate with the worker.
    4.  **Result**: UI remains at 60FPS even when resorting 1000+ agents.

### Phase 2: Zero-Latency UX (UserBehaviorPredictor)
*   **Objective**: Eliminate perceived network latency by predicting user intent.
*   **Source Asset**: `departments/technology/library/patterns/UserBehaviorPredictor.ts`
*   **Implementation Steps**:
    1.  Attach `onMouseEnter` listeners to the Scenario Tabs (Coding/Reasoning).
    2.  Implement a "Hover Intent" check (if hover > 80ms).
    3.  Trigger a silent `fetch` or pre-calculation for that scenario.
    4.  **Result**: Instant content switching.

### Phase 3: Observability (EntropyDashboard)
*   **Objective**: Real-time system health monitoring for Admins.
*   **Source Asset**: `departments/technology/library/components/ui/EntropyDashboard.tsx`
*   **Implementation Steps**:
    1.  Create a new route `/admin/dashboard` (lazy loaded).
    2.  Connect to the backend `/api/health` endpoint.
    3.  Visualize CPU, RAM, and "System Entropy" (Error Rates/Latency).

---

## 3. Immediate Next Actions (Resume at T+2h)
1.  **Import**: Copy `ChartWorkerManager` pattern to `client/src/utils/`.
2.  **Refactor**: Modify `AgentRankings.jsx` to initialize the Worker.
3.  **Verify**: Ensure sorting logic remains correct after offloading.

---

*This document serves as the checkpoint for the next development session.*
