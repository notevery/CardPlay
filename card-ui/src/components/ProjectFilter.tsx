import type React from 'react';
import { useState, useEffect } from 'react';
import { type Project } from '../services/projectService';
import CreateProjectModal from './CreateProjectModal';
import { getProjects, createProject } from '../services/projectService';

interface ProjectFilterProps {
  selectedProject: string;
  setSelectedProject: (project: string) => void;
}

const ProjectFilter: React.FC<ProjectFilterProps> = ({ selectedProject, setSelectedProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getProjects();
        setProjects(data);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('获取项目列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleCreateProject = async (project: { myId: string; name: string }) => {
    try {
      setLoading(true);
      setError(null);
      const newProject = await createProject(project);
      setProjects([...projects, newProject]);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error creating project:', err);
      setError('创建项目失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-xl text-gray-800 font-semibold mb-4">项目筛选</h2>
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-800" />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-4 py-2 rounded-full ${
              selectedProject === '' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedProject('')}
          >
            全部项目
          </button>
          {projects.map((project) => (
            <button
              key={project.id}
              className={`px-4 py-2 rounded-full ${
                selectedProject === project.myId 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedProject(project.myId)}
            >
              {project.name}
            </button>
          ))}
          <button
            className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center"
            onClick={() => setIsModalOpen(true)}
          >
            <span className="mr-1">+</span>
            <span>新建项目</span>
          </button>
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm mt-2">
          {error} 请稍后重试
        </div>
      )}

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
};

export default ProjectFilter; 