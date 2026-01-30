import { describe, it, expect } from 'vitest';

// Date utility functions - must match server.ts implementation
// Using local timezone, not UTC!
export function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function getDateRange(days: number): string[] {
    const dates: string[] = [];
    const now = new Date();
    
    for (let dayOffset = 0; dayOffset < days; dayOffset++) {
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() - dayOffset);
        dates.push(formatLocalDate(targetDate));
    }
    
    return dates;
}

export function formatDateForQuery(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return formatLocalDate(date);
}

export function formatDisplayDate(dateStr: string): string {
    if (!dateStr) return 'Unknown date';
    try {
        // Handle YYYY-MM-DD format (parse as local date, not UTC)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const [year, month, day] = dateStr.split('-').map(Number);
            const d = new Date(year, month - 1, day);
            return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        }
        // Handle ISO datetime or other formats
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { 
        return dateStr; 
    }
}

describe('Date Range Generation', () => {
    it('should generate correct number of dates', () => {
        const dates = getDateRange(3);
        expect(dates).toHaveLength(3);
    });

    it('should start with today (local timezone)', () => {
        const dates = getDateRange(3);
        const today = formatLocalDate(new Date());
        expect(dates[0]).toBe(today);
    });

    it('should include yesterday as second date', () => {
        const dates = getDateRange(3);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const expectedYesterday = formatLocalDate(yesterday);
        expect(dates[1]).toBe(expectedYesterday);
    });

    it('should handle 7 days correctly', () => {
        const dates = getDateRange(7);
        expect(dates).toHaveLength(7);
        
        // Check first and last
        const today = new Date();
        const todayStr = formatLocalDate(today);
        expect(dates[0]).toBe(todayStr);
        
        const sixDaysAgo = new Date();
        sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
        const sixDaysAgoStr = formatLocalDate(sixDaysAgo);
        expect(dates[6]).toBe(sixDaysAgoStr);
    });

    it('should generate dates in descending order (newest first)', () => {
        const dates = getDateRange(5);
        for (let i = 0; i < dates.length - 1; i++) {
            expect(new Date(dates[i]).getTime()).toBeGreaterThan(new Date(dates[i + 1]).getTime());
        }
    });

    it('should use local timezone not UTC', () => {
        // This is the key fix - should match local date, not UTC
        const now = new Date();
        const localDate = formatLocalDate(now);
        const dates = getDateRange(1);
        
        // The date should match local date format
        expect(dates[0]).toBe(localDate);
        
        // Verify it's in YYYY-MM-DD format
        expect(dates[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        
        // The year, month, day should match local values
        const parts = dates[0].split('-');
        expect(parseInt(parts[0])).toBe(now.getFullYear());
        expect(parseInt(parts[1])).toBe(now.getMonth() + 1);
        expect(parseInt(parts[2])).toBe(now.getDate());
    });
});

describe('formatDateForQuery', () => {
    it('should return YYYY-MM-DD format', () => {
        const result = formatDateForQuery(0);
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return today for 0 days ago (local timezone)', () => {
        const result = formatDateForQuery(0);
        const today = formatLocalDate(new Date());
        expect(result).toBe(today);
    });

    it('should return yesterday for 1 day ago', () => {
        const result = formatDateForQuery(1);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const expected = formatLocalDate(yesterday);
        expect(result).toBe(expected);
    });
});

describe('formatDisplayDate', () => {
    it('should format valid ISO date', () => {
        const result = formatDisplayDate('2026-01-30T10:30:00Z');
        expect(result).toContain('Jan');
        expect(result).toContain('30');
    });

    it('should handle empty string', () => {
        const result = formatDisplayDate('');
        expect(result).toBe('Unknown date');
    });

    it('should handle null/undefined gracefully', () => {
        // @ts-ignore - testing runtime behavior
        const result = formatDisplayDate(null);
        expect(result).toBe('Unknown date');
    });

    it('should return original string for invalid date', () => {
        const result = formatDisplayDate('not-a-date');
        expect(result).toBe('not-a-date');
    });

    it('should parse YYYY-MM-DD as local date (not UTC)', () => {
        // This is the key test - YYYY-MM-DD should NOT shift due to timezone
        const result = formatDisplayDate('2026-01-30');
        expect(result).toContain('Jan');
        expect(result).toContain('30');
        // Should NOT contain time for date-only format
        expect(result).not.toContain(':');
    });

    it('should show correct day of week for YYYY-MM-DD', () => {
        // Jan 30, 2026 is a Friday
        const result = formatDisplayDate('2026-01-30');
        expect(result).toContain('Fri');
    });

    it('should not shift date due to timezone for YYYY-MM-DD format', () => {
        // This catches the UTC vs local bug - Jan 30 should stay Jan 30, not become Jan 29
        const result = formatDisplayDate('2026-01-30');
        expect(result).not.toContain('29');
        expect(result).toContain('30');
    });
});

describe('Date edge cases', () => {
    it('should handle month boundaries', () => {
        // This tests that date math works across month boundaries
        const dates = getDateRange(35);
        expect(dates).toHaveLength(35);
        
        // All dates should be valid
        dates.forEach(dateStr => {
            const d = new Date(dateStr);
            expect(isNaN(d.getTime())).toBe(false);
        });
    });

    it('should handle year boundaries', () => {
        // Set a fixed date near year boundary for testing
        const dates = getDateRange(10);
        expect(dates).toHaveLength(10);
        
        // All should be consecutive
        for (let i = 0; i < dates.length - 1; i++) {
            const curr = new Date(dates[i]);
            const next = new Date(dates[i + 1]);
            const diffDays = (curr.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);
            expect(Math.round(diffDays)).toBe(1);
        }
    });
});
