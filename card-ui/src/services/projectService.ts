import { API_ENDPOINTS } from '../config/api';
import axiosInstance from './axios';

export interface Project {
  id: string;
  myId: string;
  name: string;
}

// Debug flag - set to true to see API request logs
const DEBUG = true;

// Get all projects
export const getProjects = async (): Promise<Project[]> => {
  try {
    const url = API_ENDPOINTS.projects.url;

    if (DEBUG) {
      console.log(`Fetching projects from: ${url}`);
    }

    const response = await axiosInstance.get<Project[]>(url);

    if (DEBUG) {
      console.log(`Successfully fetched ${response.data.length} projects`);
    }

    return response.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to fetch projects: ${errorMessage}`, error);
    throw error;
  }
};

// Create a new project
export const createProject = async (project: { name: string }): Promise<Project> => {
  try {
    const url = API_ENDPOINTS.projadd.url;

    if (DEBUG) {
      console.log(`Creating project at: ${url}`);
    }

    const response = await fetch(url, {
      method: API_ENDPOINTS.projadd.method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(project),
    });

    if (!response.ok) {
      throw new Error(`Error creating project: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (DEBUG) {
      console.log(`Successfully created project: ${data.name}`);
    }

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to create project: ${errorMessage}`, error);
    throw error;
  }
}; 