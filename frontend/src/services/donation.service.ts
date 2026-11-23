import apiClient from './api';
import { ApiResponse, Donation, PaginatedResponse } from '../types';

export interface DonationQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
  donorId?: string;
}

export interface NearbyDonationParams {
  latitude: number;
  longitude: number;
  maxDistanceKm?: number;
  category?: string;
}

export const donationService = {
  /**
   * Create a new food donation listing
   */
  async createDonation(data: Partial<Donation>): Promise<Donation> {
    const response = await apiClient.post<ApiResponse<Donation>>('/donations', data);
    return response.data.data;
  },

  /**
   * Get paginated list of donations with optional filters
   */
  async getDonations(params?: DonationQueryParams): Promise<PaginatedResponse<Donation>> {
    const response = await apiClient.get<PaginatedResponse<Donation>>('/donations', {
      params,
    });
    return response.data;
  },

  /**
   * Get a single donation by ID
   */
  async getDonation(id: string): Promise<Donation> {
    const response = await apiClient.get<ApiResponse<Donation>>(`/donations/${id}`);
    return response.data.data;
  },

  /**
   * Update donation details
   */
  async updateDonation(id: string, data: Partial<Donation>): Promise<Donation> {
    const response = await apiClient.patch<ApiResponse<Donation>>(`/donations/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete or archive a donation
   */
  async deleteDonation(id: string): Promise<void> {
    await apiClient.delete(`/donations/${id}`);
  },

  /**
   * Find nearby donations based on geographic coordinates and radius
   */
  async getNearbyDonations(params: NearbyDonationParams): Promise<Donation[]> {
    const response = await apiClient.get<ApiResponse<Donation[]>>('/donations/nearby', {
      params,
    });
    return response.data.data;
  },

  /**
   * Claim / request allocation for a donation
   */
  async claimDonation(
    id: string,
    data?: { requestedQuantity?: number; notes?: string }
  ): Promise<Donation> {
    const response = await apiClient.post<ApiResponse<Donation>>(`/donations/${id}/claim`, data);
    return response.data.data;
  },

  /**
   * Cancel an active donation
   */
  async cancelDonation(id: string, reason?: string): Promise<Donation> {
    const response = await apiClient.post<ApiResponse<Donation>>(`/donations/${id}/cancel`, {
      reason,
    });
    return response.data.data;
  },
};

export default donationService;
