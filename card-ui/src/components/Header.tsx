import type React from 'react';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchTerm, setSearchTerm }) => {
  return (
    <header className="bg-blue-900 text-white py-4 px-6 shadow-md">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <a href="/" className="text-2xl font-bold text-white no-underline flex items-center">
            <span className="mr-2">OperatorHub.io</span>
          </a>
        </div>
        <div className="w-full md:w-auto flex items-center">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
              </svg>
            </div>
            <input
              type="search"
              className="block w-full p-3 pl-10 text-sm text-white border border-blue-700 rounded-lg bg-blue-800 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search OperatorHub..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="ml-4 hidden md:block">
            <button className="bg-blue-700 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
              Contribute ▼
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
