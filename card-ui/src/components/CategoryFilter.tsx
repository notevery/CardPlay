import type React from 'react';
import { useState, useEffect } from 'react';
import { type Category, getCategories } from '../services/categoryService';
import CreateCategoryModal from './CreateCategoryModal';

interface CategoryFilterProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ selectedCategory, setSelectedCategory }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getCategories();
      setCategories(data);
      if (!selectedCategory && data.length > 0) {
        setSelectedCategory(data[0].myId);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('获取分类列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <aside className="w-full lg:w-64 bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl text-gray-800 font-semibold">协议分类</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="p-1 text-blue-600 hover:text-blue-800 focus:outline-none"
          title="添加协议分类"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-800" />
        </div>
      ) : (
        <ul className="space-y-2">
          {categories.map((category) => (
            <li key={category.id}>
              <button
                className={`w-full text-left px-2 py-1 rounded ${selectedCategory === category.myId ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setSelectedCategory(category.myId)}
              >
                {category.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <div className="text-red-600 text-sm mt-2 mb-4">
          {error} 请稍后重试
        </div>
      )}

      <CreateCategoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchCategories}
      />
    </aside>
  );
};

export default CategoryFilter;
