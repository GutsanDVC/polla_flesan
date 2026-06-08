import { describe, it, expect } from 'vitest';
import { PointsCalculatorService } from '../server/services/PointsCalculatorService';

describe('PointsCalculatorService', () => {
  const calculator = new PointsCalculatorService();

  it('should award 12 points for exact result (10 exact + 2 total goals)', () => {
    expect(calculator.calculatePointsForMatch(2, 1, 2, 1)).toBe(12);
  });

  it('should award 6 points for correct winner but same total goals (5 winner + 1 home goals)', () => {
    expect(calculator.calculatePointsForMatch(2, 1, 3, 1)).toBe(6);
  });

  it('should award 2 points for correct total goals only', () => {
    expect(calculator.calculatePointsForMatch(2, 1, 1, 2)).toBe(2);
  });

  it('should award 1 point for correct home team goals only', () => {
    expect(calculator.calculatePointsForMatch(2, 1, 2, 3)).toBe(1);
  });

  it('should award 1 point for correct away team goals only', () => {
    expect(calculator.calculatePointsForMatch(2, 1, 0, 1)).toBe(1);
  });

  it('should award 0 points for completely wrong prediction', () => {
    expect(calculator.calculatePointsForMatch(3, 0, 0, 1)).toBe(0);
  });

  it('should handle draw correctly: exact draw = 12 pts, correct draw wrong score = 5 pts', () => {
    expect(calculator.calculatePointsForMatch(1, 1, 1, 1)).toBe(12);
    expect(calculator.calculatePointsForMatch(1, 1, 2, 2)).toBe(5);
  });

  it('should combine points correctly', () => {
    expect(calculator.calculatePointsForMatch(2, 1, 2, 0)).toBe(6);
  });
});
