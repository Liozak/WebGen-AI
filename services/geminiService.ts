import { GeneratedSite, Project } from '../types';

// Use environment variable for backend URL, default to http://localhost:8000
// Note: We strip trailing slashes to ensure consistency
const BASE_URL = ((import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_BASE_URL = `${BASE_URL}/api`;

// Health Check
export const checkHealth = async (): Promise<boolean> => {
  try {
    // We check the root /health endpoint which is lightweight
    const response = await fetch(`${BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Create (Generate) Project
export const createProject = async (userPrompt: string): Promise<Project> => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userPrompt }),
    });

    if (!response.ok) {
      let errorMessage = `Server error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // Ignore JSON parse error
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Project Creation Error:", error);
    // Distinguish network errors
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error("Cannot connect to backend server.");
    }
    throw new Error(error.message || "Failed to generate website");
  }
};

// Fetch All Projects
export const getProjects = async (): Promise<Project[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects`);
    if (!response.ok) throw new Error(`Status ${response.status}`);
    return await response.json();
  } catch (error: any) {
    // Only log unexpected errors. 'Failed to fetch' is expected if backend is down.
    if (error.name !== 'TypeError' && error.message !== 'Failed to fetch') {
        console.error("Fetch History Error:", error);
    }
    
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error("Failed to fetch"); 
    }
    throw error;
  }
};

// Fetch Single Project
export const getProject = async (id: string): Promise<Project> => {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`);
  if (!response.ok) throw new Error("Failed to fetch project");
  return await response.json();
};

// Update Project (Rename)
export const updateProject = async (id: string, updates: Partial<Project>): Promise<Project> => {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error("Failed to update project");
  return await response.json();
};

// Delete Project
export const deleteProject = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error("Failed to delete project");
};

// Legacy support wrapper
export const generateWebsite = async (userPrompt: string): Promise<GeneratedSite> => {
    const project = await createProject(userPrompt);
    return project.code;
};