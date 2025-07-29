import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const AIQuery = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setAnswer('');

    try {
      const response = await fetch('https://breakfast-factory-jumia.onrender.com/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      toast.error('Error querying AI: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Ask AI about your store</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., How many sales yesterday?"
            className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
      {loading && <p className="mt-4 text-gray-500">Thinking...</p>}
      {answer && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md overflow-auto max-h-96">
          <div className="text-gray-800 prose prose-sm max-w-none prose-headings:text-orange-600 prose-headings:font-bold prose-p:text-gray-700 prose-li:marker:text-orange-500">
            <ReactMarkdown>{answer}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIQuery;