import { apiClient } from '@/lib/apiClient';
import type {
  Bin,
  BackendBin,
  BinType,
  BinStatus,
  BinStats,
  CreateBinData,
} from '@/features/waste-management/types';

// Transform backend bin format to frontend format
function transformBin(backendBin: any): Bin {
  const typeMap: Record<string, 'Recyclable' | 'General Waste' | 'Hazardous'> =
    {
      RECYCLABLE: 'Recyclable',
      GENERAL: 'General Waste',
      HAZARDOUS: 'Hazardous',
      ORGANIC: 'General Waste',
    };

  const colorMap: Record<string, string> = {
    RECYCLABLE: 'text-green-600',
    GENERAL: 'text-blue-600',
    HAZARDOUS: 'text-yellow-600',
    ORGANIC: 'text-green-600',
  };

  return {
    id: backendBin.id,
    name: backendBin.bin_name,
    type: typeMap[backendBin.bin_type] || 'General Waste',
    color: colorMap[backendBin.bin_type] || 'text-gray-600',
    lat: Number(backendBin.latitude),
    lng: Number(backendBin.longitude),
    distance: backendBin.distance,
    numericDistance: backendBin.numericDistance,
  };
}

export class BinApiService {
  static async getAllBins(filters?: {
    bin_type?: BinType;
    status?: BinStatus;
  }): Promise<BackendBin[]> {
    const params = new URLSearchParams();
    if (filters?.bin_type) params.append('bin_type', filters.bin_type);
    if (filters?.status) params.append('status', filters.status);

    const response = await apiClient.get(`/bins?${params}`);
    const data = response.data;

    // After interceptor, data is { bins: [...] }
    if (!data || !data.bins || !Array.isArray(data.bins)) {
      console.error('Invalid response structure in getAllBins:', data);
      throw new Error('Failed to fetch bins: Invalid response structure');
    }

    // Convert Decimal types to numbers
    return data.bins.map((bin: any) => ({
      ...bin,
      latitude:
        typeof bin.latitude === 'string' ? Number(bin.latitude) : bin.latitude,
      longitude:
        typeof bin.longitude === 'string'
          ? Number(bin.longitude)
          : bin.longitude,
      capacity_kg: bin.capacity_kg
        ? typeof bin.capacity_kg === 'string'
          ? Number(bin.capacity_kg)
          : bin.capacity_kg
        : null,
      total_collected_weight:
        typeof bin.total_collected_weight === 'string'
          ? Number(bin.total_collected_weight)
          : bin.total_collected_weight,
    }));
  }

  static async getBinById(id: number): Promise<BackendBin> {
    const response = await apiClient.get(`/bins/${id}`);
    const data = response.data;
    return data.bin;
  }

  static async createBin(binData: CreateBinData): Promise<BackendBin> {
    // Ensure proper data types
    const payload = {
      bin_name: binData.bin_name.trim(),
      bin_type: binData.bin_type,
      latitude: Number(binData.latitude),
      longitude: Number(binData.longitude),
      address: binData.address?.trim() || null,
      capacity_kg: binData.capacity_kg ? Number(binData.capacity_kg) : null,
    };

    // Validate payload
    if (!payload.bin_name) {
      throw new Error('Bin name is required');
    }
    if (isNaN(payload.latitude) || isNaN(payload.longitude)) {
      throw new Error('Valid coordinates are required');
    }
    if (payload.latitude < -90 || payload.latitude > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }
    if (payload.longitude < -180 || payload.longitude > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }

    try {
      const response = await apiClient.post('/bins', payload);
      // After interceptor, response.data is the bin object directly
      return response.data;
    } catch (error: any) {
      // Extract error message from response
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        error?.message ||
        'Failed to create bin';
      throw new Error(errorMessage);
    }
  }

  static async updateBinStatus(
    id: number,
    status: BinStatus
  ): Promise<BackendBin> {
    const response = await apiClient.put(`/bins/${id}/status`, { status });
    const data = response.data;
    return data;
  }

  static async deleteBin(id: number): Promise<void> {
    await apiClient.delete(`/bins/${id}`);
  }

  static async recordCollection(
    id: number,
    weight?: number
  ): Promise<BackendBin> {
    const response = await apiClient.post(`/bins/${id}/collect`, {
      collected_weight: weight,
    });
    const data = response.data;
    return data;
  }

  static async getNearestBins(
    lat: number,
    lng: number,
    binType?: BinType,
    limit = 5
  ): Promise<Bin[]> {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      limit: limit.toString(),
    });
    if (binType) params.append('bin_type', binType);

    const response = await apiClient.get(`/bins/nearest?${params}`);
    const data = response.data;
    return data.bins.map(transformBin);
  }

  static async getBinStats(): Promise<BinStats> {
    const response = await apiClient.get('/bins/stats');
    const data = response.data;
    return data.stats;
  }
}
