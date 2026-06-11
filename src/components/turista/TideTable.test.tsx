import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TideTable from './TideTable';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

// Mocking useApp
vi.mock('@/context/AppContext', () => ({
  useApp: () => ({
    
    isUserPremium: () => false,
    setShowUpsell: vi.fn(),
    serverDate: new Date(),
    vipConfig: null,
  }),
}));

// Mocking sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockTideData = {
  hourly: {
    time: ["2026-06-03T00:00", "2026-06-03T01:00", "2026-06-03T02:00"],
    sea_level_height_msl: [0.5, 0.8, 0.4]
  }
};

describe('TideTable Geocoding Fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should trigger fallback search with " Alagoas" when first search returns no results', async () => {
    const mockFetch = global.fetch as any;
    
    // Initial fetch for Maragogi (default)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTideData,
    });

    render(<TideTable />);

    // Wait for initial loading to finish and component to show content
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Digite a cidade/i)).toBeInTheDocument();
    });

    // Mock geocoding calls
    // 1st: "Pajuçara" -> empty
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    });
    
    // 2nd: "Pajuçara Alagoas" -> results
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [{ name: 'Pajuçara', admin1: 'Alagoas', latitude: -9.6, longitude: -35.7 }]
      }),
    });

    // 3rd: Tide data for the found location
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTideData,
    });

    const input = screen.getByPlaceholderText(/Digite a cidade/i);
    fireEvent.change(input, { target: { value: 'Pajuçara' } });
    
    const submitButton = screen.getByLabelText(/Pesquisar/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Verify first geocoding call
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('name=Paju%C3%A7ara'));
      // Verify fallback geocoding call
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('name=Paju%C3%A7ara%20Alagoas'));
    }, { timeout: 2000 });
  });
});
