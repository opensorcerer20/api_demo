import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  findEveningForecast,
  formatLocation,
  isBeforeSunset,
} from '../src/server.js';

describe('Evening Forecast Logic', () => {
  describe('isBeforeSunset', () => {
    it('returns true when current time is before sunset', () => {
      const currentTime = new Date('2025-11-18T14:00:00Z');
      const sunsetTime = new Date('2025-11-18T18:00:00Z');
      
      expect(isBeforeSunset(currentTime, sunsetTime)).toBe(true);
    });

    it('returns false when current time is after sunset', () => {
      const currentTime = new Date('2025-11-18T19:00:00Z');
      const sunsetTime = new Date('2025-11-18T18:00:00Z');
      
      expect(isBeforeSunset(currentTime, sunsetTime)).toBe(false);
    });

    it('returns false when current time equals sunset', () => {
      const currentTime = new Date('2025-11-18T18:00:00Z');
      const sunsetTime = new Date('2025-11-18T18:00:00Z');
      
      expect(isBeforeSunset(currentTime, sunsetTime)).toBe(false);
    });

    it('works across different timezones', () => {
      const currentTime = new Date('2025-11-18T20:00:00-06:00'); // 8 PM CST
      const sunsetTime = new Date('2025-11-18T23:00:00-06:00');  // 11 PM CST
      
      expect(isBeforeSunset(currentTime, sunsetTime)).toBe(true);
    });

    it('handles edge case near midnight', () => {
      const currentTime = new Date('2025-11-18T23:59:00Z');
      const sunsetTime = new Date('2025-11-19T00:01:00Z');
      
      expect(isBeforeSunset(currentTime, sunsetTime)).toBe(true);
    });
  });

  describe('findEveningForecast', () => {
    it('returns forecast for 3 AM tomorrow when data exists', () => {
      const hourlyTimes = [
        '2025-11-18T12:00:00',
        '2025-11-18T13:00:00',
        '2025-11-19T03:00:00', // Tomorrow at 3 AM
        '2025-11-19T04:00:00',
      ];
      const hourlyTemps = [72, 70, 55, 54];
      const currentTimeStr = '2025-11-18T15:00:00';

      const result = findEveningForecast(hourlyTimes, hourlyTemps, currentTimeStr);

      expect(result).toEqual({
        temperature: 55,
        time: '2025-11-19T03:00:00',
      });
    });

    it('returns null when 3 AM tomorrow is not in hourly data', () => {
      const hourlyTimes = [
        '2025-11-18T12:00:00',
        '2025-11-18T13:00:00',
        '2025-11-18T14:00:00',
      ];
      const hourlyTemps = [72, 70, 68];
      const currentTimeStr = '2025-11-18T15:00:00';

      const result = findEveningForecast(hourlyTimes, hourlyTemps, currentTimeStr);

      expect(result).toBeNull();
    });

    it('correctly identifies tomorrow across month boundary', () => {
      const hourlyTimes = [
        '2025-11-30T20:00:00',
        '2025-11-30T21:00:00',
        '2025-12-01T03:00:00', // Next day at 3 AM
        '2025-12-01T04:00:00',
      ];
      const hourlyTemps = [60, 58, 45, 44];
      const currentTimeStr = '2025-11-30T22:00:00';

      const result = findEveningForecast(hourlyTimes, hourlyTemps, currentTimeStr);

      expect(result).toEqual({
        temperature: 45,
        time: '2025-12-01T03:00:00',
      });
    });

    it('correctly identifies tomorrow across year boundary', () => {
      const hourlyTimes = [
        '2025-12-31T20:00:00',
        '2025-12-31T21:00:00',
        '2026-01-01T03:00:00', // New year at 3 AM
        '2026-01-01T04:00:00',
      ];
      const hourlyTemps = [35, 33, 28, 27];
      const currentTimeStr = '2025-12-31T22:00:00';

      const result = findEveningForecast(hourlyTimes, hourlyTemps, currentTimeStr);

      expect(result).toEqual({
        temperature: 28,
        time: '2026-01-01T03:00:00',
      });
    });

    it('handles empty hourly data arrays', () => {
      const hourlyTimes: string[] = [];
      const hourlyTemps: number[] = [];
      const currentTimeStr = '2025-11-18T15:00:00';

      const result = findEveningForecast(hourlyTimes, hourlyTemps, currentTimeStr);

      expect(result).toBeNull();
    });

    it('ignores 3 AM today, only looks for tomorrow', () => {
      const hourlyTimes = [
        '2025-11-18T03:00:00', // Today at 3 AM (should be ignored)
        '2025-11-18T12:00:00',
        '2025-11-18T13:00:00',
        '2025-11-19T03:00:00', // Tomorrow at 3 AM (should match)
      ];
      const hourlyTemps = [50, 72, 70, 55];
      const currentTimeStr = '2025-11-18T15:00:00';

      const result = findEveningForecast(hourlyTimes, hourlyTemps, currentTimeStr);

      expect(result).toEqual({
        temperature: 55,
        time: '2025-11-19T03:00:00',
      });
    });

    it('works with timezone-aware timestamps', () => {
      const hourlyTimes = [
        '2025-11-18T12:00:00-06:00',
        '2025-11-18T13:00:00-06:00',
        '2025-11-19T03:00:00-06:00', // Tomorrow at 3 AM CST
        '2025-11-19T04:00:00-06:00',
      ];
      const hourlyTemps = [72, 70, 55, 54];
      const currentTimeStr = '2025-11-18T15:00:00-06:00';

      const result = findEveningForecast(hourlyTimes, hourlyTemps, currentTimeStr);

      expect(result).toEqual({
        temperature: 55,
        time: '2025-11-19T03:00:00-06:00',
      });
    });
  });

  describe('formatLocation', () => {
    it('correctly formats city and state', () => {
      expect(formatLocation('New Braunfels', 'TX')).toBe('New Braunfels, TX');
    });

    it('handles single word cities', () => {
      expect(formatLocation('Austin', 'TX')).toBe('Austin, TX');
    });

    it('handles multi-word cities', () => {
      expect(formatLocation('San Antonio', 'TX')).toBe('San Antonio, TX');
    });

    it('handles cities with special characters', () => {
      expect(formatLocation("Coeur d'Alene", 'ID')).toBe("Coeur d'Alene, ID");
    });

    it('preserves exact spacing', () => {
      expect(formatLocation('Los Angeles', 'CA')).toBe('Los Angeles, CA');
    });
  });
});
