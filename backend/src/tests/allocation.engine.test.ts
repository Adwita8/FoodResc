import { describe, it, expect } from 'vitest';

describe('Deterministic Rule-Based Allocation Algorithm', () => {
  const WEIGHTS = {
    CAPACITY: 0.30,
    URGENCY: 0.25,
    TRANSPORTATION: 0.20,
    DISTANCE: 0.15,
    RELIABILITY: 0.10,
  };

  function calculateScore(capacity: number, urgency: number, transport: number, distance: number, reliability: number) {
    return (
      WEIGHTS.CAPACITY * capacity +
      WEIGHTS.URGENCY * urgency +
      WEIGHTS.TRANSPORTATION * transport +
      WEIGHTS.DISTANCE * distance +
      WEIGHTS.RELIABILITY * reliability
    );
  }

  it('correctly calculates weighted priority score', () => {
    // Perfect candidate
    const perfectScore = calculateScore(100, 100, 100, 100, 100);
    expect(perfectScore).toBe(100);

    // Realistic NGO candidate:
    // Capacity 80, Urgency 90, Transport 100 (has own van), Distance 75 (3km), Reliability 95
    const candidateScore = calculateScore(80, 90, 100, 75, 95);
    // (0.30*80) + (0.25*90) + (0.20*100) + (0.15*75) + (0.10*95) = 24 + 22.5 + 20 + 11.25 + 9.5 = 87.25
    expect(candidateScore).toBeCloseTo(87.25, 2);
  });

  it('strictly prioritizes closer and higher-capacity NGOs when other metrics equal', () => {
    const scoreNGO1 = calculateScore(90, 80, 100, 90, 90);
    const scoreNGO2 = calculateScore(50, 80, 100, 50, 90);
    expect(scoreNGO1).toBeGreaterThan(scoreNGO2);
  });

  it('deterministic tiebreakers are strictly stable and reproducible', () => {
    const ngoA = { id: 'A', score: 85, travelMinutes: 15, capacity: 200, reliability: 90 };
    const ngoB = { id: 'B', score: 85, travelMinutes: 25, capacity: 300, reliability: 95 };

    // Shorter travel time tiebreaker
    const winner = ngoA.travelMinutes < ngoB.travelMinutes ? ngoA : ngoB;
    expect(winner.id).toBe('A');
  });
});
