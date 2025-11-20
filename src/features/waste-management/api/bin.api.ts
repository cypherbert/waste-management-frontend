import { apiClient } from '@/lib/apiClient';
import type { Bin, ApiResponse } from '@/features/waste-management/types';

export async function fetchBins(): Promise<Bin[]> {
  const response = await apiClient.get('/bins');
  const data: ApiResponse<Bin[]> = response.data;

  if (!data.success || !data.data) {
    throw new Error('Failed to fetch bins');
  }

  return data.data;
}

export async function fetchNearbyBins(
  lat: number,
  lng: number,
  type: string = 'All',
  search: string = ''
): Promise<Bin[]> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    type,
    search,
  });

  const response = await apiClient.get(`/bins/nearby?${params}`);
  const data: ApiResponse<Bin[]> = response.data;

  if (!data.success || !data.data) {
    throw new Error('Failed to fetch nearby bins');
  }

  return data.data;
}

export async function fetchBinById(id: number): Promise<Bin> {
  const response = await apiClient.get(`/bins/${id}`);
  const data: ApiResponse<Bin> = response.data;

  if (!data.success || !data.data) {
    throw new Error('Bin not found');
  }

  return data.data;
}

export async function fetchNearestBin(lat: number, lng: number): Promise<Bin> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
  });

  const response = await apiClient.get(`/bins/nearest?${params}`);
  const data: ApiResponse<Bin> = response.data;

  if (!data.success || !data.data) {
    throw new Error('Failed to fetch nearest bin');
  }

  return data.data;
}
