import type React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-blue-900 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p>© 2025 OperatorHub.io | The registry for Kubernetes Operators</p>
          </div>
          <div className="flex space-x-6">
            <a href="https://github.com/operator-framework" className="text-white hover:text-blue-300" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href="https://kubernetes.io/" className="text-white hover:text-blue-300" target="_blank" rel="noopener noreferrer">
              Kubernetes
            </a>
            <a href="https://www.redhat.com/en/technologies/cloud-computing/openshift" className="text-white hover:text-blue-300" target="_blank" rel="noopener noreferrer">
              OpenShift
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
