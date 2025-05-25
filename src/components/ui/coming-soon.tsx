
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ComingSoonProps {
  title: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ title }) => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {title}
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          This feature is coming soon! We're working hard to bring you the best experience.
        </p>
        <Button 
          onClick={handleBackToHome}
          className="bg-gray-800 hover:bg-gray-900 text-white font-medium"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default ComingSoon;
