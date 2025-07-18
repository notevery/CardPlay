import { API_BASE_URL, API_ENDPOINTS, buildApiUrl } from '../config/api';
import { ProtocolType } from './categoryService';
import axiosInstance from './axios';

export interface Operator {
  id: string;
  myId: string;
  name: string;
  description: string;
  url: string;
  logo?: string;
  provider: string;
  category: string; // 这里存储的是category的myId，即ProtocolType
  project: string;
  createdAt: string;
  host: string;
  port: number;
  username: string;
  password: string;
}

// Debug flag - set to true to see API request logs
const DEBUG = true;

// Get all operators with optional filtering
export const getOperators = async (params?: {
  search?: string;
  category?: string;
  project?: string;
  sort?: 'asc' | 'desc';
}): Promise<Operator[]> => {
  try {
    // Convert params to a format that buildApiUrl expects
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.category) queryParams.category = params.category;
    if (params?.project) queryParams.project = params.project;
    if (params?.sort) queryParams.sort = params.sort;

    const url = buildApiUrl(API_ENDPOINTS.operators.url, queryParams);

    if (DEBUG) {
      console.log(`Fetching operators from: ${url}`);
      console.log('Query params:', queryParams);
    }

    const response = await axiosInstance.get<Operator[]>(url);

    if (DEBUG) {
      console.log(`Successfully fetched ${response.data.length} operators`);
    }

    return response.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to fetch operators: ${errorMessage}`, error);
    throw error;
  }
};

// Get a single operator by ID
export const getOperatorById = async (id: string): Promise<Operator> => {
  try {
    const url = `${API_ENDPOINTS.operators.url}/${id}`;

    if (DEBUG) {
      console.log(`Fetching operator with ID ${id} from: ${url}`);
    }

    const response = await axiosInstance.get<Operator>(url);

    if (DEBUG) {
      console.log(`Successfully fetched operator: ${response.data.name}`);
    }

    return response.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to fetch operator with ID ${id}: ${errorMessage}`, error);
    throw error;
  }
};

// Create a new operator
export const createOperator = async (operator: Omit<Operator, 'id' | 'createdAt'>): Promise<Operator> => {
  try {
    const url = API_ENDPOINTS.operators.url;

    if (DEBUG) {
      console.log(`Creating operator at: ${url}`);
    }

    const response = await axiosInstance.post<Operator>(url, operator);

    if (DEBUG) {
      console.log(`Successfully created operator: ${response.data.name}`);
    }

    return response.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to create operator: ${errorMessage}`, error);
    throw error;
  }
};

class OperatorService {
  private baseUrl = API_BASE_URL;

  async getOperators(): Promise<Operator[]> {
    const response = await axiosInstance.get<Operator[]>(`${this.baseUrl}/operators`);
    return response.data;
  }

  async createOperator(operator: Omit<Operator, 'id'>): Promise<Operator> {
    const response = await axiosInstance.post<Operator>(`${this.baseUrl}/operators`, operator);
    return response.data;
  }

  async updateOperator(id: string, operator: Partial<Operator>): Promise<Operator> {
    const response = await axiosInstance.put<Operator>(`${this.baseUrl}/operators/${id}`, operator);
    return response.data;
  }

  async deleteOperator(id: string): Promise<void> {
    await axiosInstance.delete(`${this.baseUrl}/operators/${id}`);
  }

  async getOperatorById(id: string): Promise<Operator | null> {
    try {
      const response = await axiosInstance.get<Operator>(`${API_BASE_URL}/api/operators/${id}`);
      return response.data;
    } catch (error) {
      console.error('获取operator失败:', error);
      return null;
    }
  }
}

export const operatorService = new OperatorService();
