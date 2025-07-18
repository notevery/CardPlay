import type React from 'react';

const Welcome: React.FC = () => {
  return (
    <section className="py-16 text-white text-center bg-blue-800 bg-opacity-30">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Welcome to OperatorHub.io</h1>
        <p className="text-xl max-w-3xl mx-auto">
          OperatorHub.io is a new home for the Kubernetes community to share Operators.
          Find an existing Operator or list your own today.
        </p>
      </div>
    </section>
  );
};

export default Welcome;
