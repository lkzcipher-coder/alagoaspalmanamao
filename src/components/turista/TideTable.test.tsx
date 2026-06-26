import { render, screen, waitFor } from '@testing-library/react';
import TideTable from './TideTable';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

const serverDate = new Date('2026-06-26T12:00:00');

const { mockMaybeSingle, mockTidesLte, mockFrom } = vi.hoisted(() => {
  const mockMaybeSingle = vi.fn();
  const mockTidesLte = vi.fn();
  const mockFrom = vi.fn((table: string) => {
    if (table === 'app_settings') {
      return {
        select: vi.fn(() => ({
          limit: vi.fn(() => ({
            maybeSingle: mockMaybeSingle,
          })),
        })),
      };
    }

    if (table === 'tides_data') {
      return {
        select: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: mockTidesLte,
          })),
        })),
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return { mockMaybeSingle, mockTidesLte, mockFrom };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
  },
}));

vi.mock('@/context/AppContext', () => ({
  useApp: () => ({
    isUserPremium: () => false,
    setShowUpsell: vi.fn(),
    serverDate,
    financialConfig: { vip_price: 29.9 },
    appSettings: {
      tide_open_time: '00:00',
      tide_close_time: '23:59',
    },
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('TideTable Supabase tides data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaybeSingle.mockResolvedValue({
      data: { tide_open_time: '00:00', tide_close_time: '23:59' },
      error: null,
    });
    mockTidesLte.mockResolvedValue({
      data: [{ tide_date: '2026-06-26', tide_time: '06:30:00', height: 0.3 }],
      error: null,
    });
  });

  it('renders Paripueira tide data from Supabase instead of geocoding search', async () => {
    render(<TideTable />);

    await waitFor(() => {
      expect(screen.getByText('Tabela de Marés - Paripueira')).toBeInTheDocument();
      expect(screen.getByText('Paripueira - AL')).toBeInTheDocument();
      expect(screen.getByText('06:30')).toBeInTheDocument();
      expect(screen.getByText('0,3m')).toBeInTheDocument();
    });

    expect(screen.queryByPlaceholderText(/Digite a cidade/i)).not.toBeInTheDocument();

    expect(mockFrom).toHaveBeenCalledWith('app_settings');
    expect(mockFrom).toHaveBeenCalledWith('tides_data');
  });
});
