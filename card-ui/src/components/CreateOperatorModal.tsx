import React, { useState, useEffect } from 'react';
import { createOperator } from '../services/operatorService';
import { getCategories, type Category, ProtocolType } from '../services/categoryService';
import { getProjects } from '../services/projectService';
import type { Project } from '../services/projectService';

interface CreateOperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  myId: string;
  name: string;
  provider: string;
  description: string;
  category: string;
  project: string;
  logo: string;
  url: string;
  host: string;
  port: string;
  username: string;
  password: string;
  database: string;
}

const initialFormData: FormData = {
  myId: '',
  name: '',
  provider: '',
  description: '',
  category: '',
  project: '',
  logo: '',
  url: '',
  host: '',
  port: '',
  username: '',
  password: '',
  database: ''
};

const CreateOperatorModal: React.FC<CreateOperatorModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, projectsData] = await Promise.all([
          getCategories(),
          getProjects()
        ]);
        setCategories(categoriesData);
        setProjects(projectsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('获取数据失败，请稍后重试');
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 生成myId
      const selectedCategory = categories.find(c => c.myId === formData.category);
      const selectedProject = projects.find(p => p.myId === formData.project);
      const myId = `${selectedCategory?.myId}-${selectedProject?.myId}-${Date.now()}`;

      // 根据协议类型处理数据
      const operatorData = {
        ...formData,
        myId,
        port: formData.port ? parseInt(formData.port) : undefined
      };

      await createOperator(operatorData);
      onSuccess();
      onClose();
      setFormData(initialFormData);
    } catch (err) {
      console.error('Error creating operator:', err);
      setError('创建资源失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 根据协议类型渲染表单字段
  const renderFormFields = () => {
    const selectedCategory = categories.find(c => c.myId === formData.category);
    console.log('Selected category:', selectedCategory); // 添加调试日志
    
    if (!selectedCategory) return null;

    switch (selectedCategory.myId) {
      case ProtocolType.HTTP:
        return (
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="url">
              URL
            </label>
            <input
              type="text"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              placeholder="https://example.com"
            />
          </div>
        );
      
      case ProtocolType.SSH:
        return (
          <>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="host">
                主机地址
              </label>
              <input
                type="text"
                id="host"
                name="host"
                value={formData.host}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                placeholder="example.com"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="port">
                端口
              </label>
              <input
                type="number"
                id="port"
                name="port"
                value={formData.port}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="22"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                用户名
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                placeholder="root"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                密码
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                placeholder="请输入密码"
              />
            </div>
          </>
        );
      
      case 'MYSQL':
        return (
          <>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="host">
                主机地址
              </label>
              <input
                type="text"
                id="host"
                name="host"
                value={formData.host}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="port">
                端口
              </label>
              <input
                type="text"
                id="port"
                name="port"
                value={formData.port}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="3306"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                用户名
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                密码
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="database">
                数据库名
              </label>
              <input
                type="text"
                id="database"
                name="database"
                value={formData.database}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
          </>
        );
      
      case ProtocolType.POSTGRES:
      case ProtocolType.REDIS:
        return (
          <>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="host">
                主机地址
              </label>
              <input
                type="text"
                id="host"
                name="host"
                value={formData.host}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                placeholder="localhost"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="port">
                端口
              </label>
              <input
                type="number"
                id="port"
                name="port"
                value={formData.port}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder={selectedCategory.myId === ProtocolType.POSTGRES ? '5432' : '6379'}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                用户名
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                placeholder="root"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                密码
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                placeholder="请输入密码"
              />
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  // 处理协议类型变更
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    // 清空协议特定字段
    setFormData(prev => ({
      ...prev,
      category: value,
      url: '',
      host: '',
      port: value === 'MYSQL' ? '3306' : '',
      username: '',
      password: '',
      database: ''
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-8 w-full max-w-4xl my-8">
        <h2 className="text-2xl font-bold mb-6">添加新资源</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 重要字段独占一行 */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                协议类型
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleCategoryChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="">请选择协议类型</option>
                {categories.map(category => (
                  <option key={category.myId} value={category.myId}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="project">
                所属项目
              </label>
              <select
                id="project"
                name="project"
                value={formData.project}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="">请选择项目</option>
                {projects.map(project => (
                  <option key={project.myId} value={project.myId}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                名称
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
          </div>

          {/* 其他字段双列显示 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="provider">
                提供商
              </label>
              <input
                type="text"
                id="provider"
                name="provider"
                value={formData.provider}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="logo">
                图标URL
              </label>
              <input
                type="text"
                id="logo"
                name="logo"
                value={formData.logo}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                描述
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows={3}
                required
              />
            </div>
          </div>

          {/* 协议特定字段 - 双列显示 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {renderFormFields()}
          </div>

          {/* 按钮 - 全宽显示 */}
          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              {loading ? '添加中...' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOperatorModal; 