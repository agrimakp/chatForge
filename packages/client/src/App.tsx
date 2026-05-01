import { useState, useEffect } from 'react';
import { Button } from './components/ui/button';

function App() {
  const [message, setMessage] = useState('');
  useEffect(() => {
    fetch('/api/hello')
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
      .catch((error) => console.error('Error:', error));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold underline">{message}</h1>
      <Button className="bg-blue-500 text-white hover:bg-blue-600">
        Click me
          </Button>
    </div>
  );
}

export default App;
