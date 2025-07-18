import { API_ENDPOINTS, buildApiUrl } from '../config/api';
import axiosInstance from './axios';

export enum ProtocolType {
  HTTP = 'HTTP',
  SSH = 'SSH',
  MYSQL = 'MYSQL',
  POSTGRES = 'POSTGRES',
  REDIS = 'REDIS'
}

export interface Category {
  id: string;
  myId: ProtocolType; // 使用ProtocolType作为myId
  name: string;
  description?: string;
}

// Debug flag - set to true to see API request logs
const DEBUG = true;

// Fallback categories in case the API fails
export const fallbackCategories: Category[] = [
  { id: '1', myId: ProtocolType.SSH, name: '终端' },
  { id: '2', myId: ProtocolType.HTTP, name: '系统/网页' },
  { id: '3', myId: ProtocolType.MYSQL, name: 'MySQL数据库' },
  { id: '4', myId: ProtocolType.POSTGRES, name: 'PostgreSQL数据库' },
  { id: '5', myId: ProtocolType.REDIS, name: 'Redis数据库' }
];

// Get all categories
export const getCategories = async (): Promise<Category[]> => {
  try {
    const url = API_ENDPOINTS.categories.url;

    if (DEBUG) {
      console.log(`Fetching categories from: ${url}`);
    }

    const response = await axiosInstance.get<Category[]>(url);

    if (DEBUG) {
      console.log(`Successfully fetched ${response.data.length} categories`);
    }

    return response.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to fetch categories: ${errorMessage}`, error);

    if (DEBUG) {
      console.log('Falling back to static categories...');
    }

    // Return a copy of the fallback categories to avoid mutating them
    return [...fallbackCategories];
  }
};

export const addCategory = async (category: { myId: string; name: string }): Promise<Category> => {
  const response = await axiosInstance.post<Category>(API_ENDPOINTS.addcategorie.url, category);
  return response.data;
};
