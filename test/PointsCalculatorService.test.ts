import { describe, it, expect } from 'vitest';
import { PointsCalculatorService } from '../server/services/PointsCalculatorService';
import type { Phase } from '../types/domain';

describe('PointsCalculatorService', () => {
  const calculator = new PointsCalculatorService();

  it('should award 10 points for exact result in GROUP phase', () => {
    expect(calculator.calculatePointsForMatch(2, 1, 2, 1, 'GROUP')).toBe(10);
  });

  it('should award 5 points for correct winner in GROUP phase', () => {
    expect(calculator.calculatePointsForMatch(2, 1, 3, 1, 'GROUP')).toBe(5);
  });

  it('should award 0 points for wrong winner with correct total goals', () => {
    expect(calculator.calculatePointsForMatch(2, 1, 1, 2, 'GROUP')).toBe(0);
  });

  it('should award 0 points for correct home goals but wrong winner', () => {
    expect(calculator.calculatePointsForMatch(2, 1, 2, 3, 'GROUP')).toBe(0);
  });

  it('should award 0 points for correct away goals but wrong winner', () => {
    expect(calculator.calculatePointsForMatch(2, 1, 0, 1, 'GROUP')).toBe(0);
  });

  it('should award 0 points for completely wrong prediction', () => {
    expect(calculator.calculatePointsForMatch(3, 0, 0, 1, 'GROUP')).toBe(0);
  });

  it('should handle draws correctly: exact draw = 10 pts, correct draw wrong score = 5 pts', () => {
    expect(calculator.calculatePointsForMatch(1, 1, 1, 1, 'GROUP')).toBe(10);
    expect(calculator.calculatePointsForMatch(1, 1, 2, 2, 'GROUP')).toBe(5);
  });

  it('should apply phase multipliers correctly', () => {
    const baseCases = [
      { homeReal: 2, awayReal: 1, homePred: 2, awayPred: 1, expected: 10 },
      { homeReal: 2, awayReal: 1, homePred: 3, awayPred: 1, expected: 5 },
    ];

    const phaseMultipliers: Record<Phase, number> = {
      GROUP: 1,
      R32: 2,
      R16: 4,
      QUARTERS: 8,
      SEMIS: 16,
      THIRD_PLACE: 32,
      FINAL: 64,
    };

    for (const phase of Object.keys(phaseMultipliers) as Phase[]) {
      for (const c of baseCases) {
        const result = calculator.calculatePointsForMatch(c.homeReal, c.awayReal, c.homePred, c.awayPred, phase);
        expect(result).toBe(c.expected * phaseMultipliers[phase]);
      }
    }
  });

  it('should award 640 points for exact result in FINAL (10 x 64)', () => {
    expect(calculator.calculatePointsForMatch(2, 1, 2, 1, 'FINAL')).toBe(640);
  });

  it('should award 320 points for correct winner in FINAL (5 x 64)', () => {
    expect(calculator.calculatePointsForMatch(2, 1, 3, 1, 'FINAL')).toBe(320);
  });

  it('should award 0 points for wrong prediction in FINAL', () => {
    expect(calculator.calculatePointsForMatch(2, 1, 0, 1, 'FINAL')).toBe(0);
  });
});
