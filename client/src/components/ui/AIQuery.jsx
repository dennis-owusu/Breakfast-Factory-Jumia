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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/20 p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Ask AI about your store
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., How many sales yesterday?"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                     placeholder-gray-500 dark:placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 
                     focus:border-transparent transition-colors duration-200"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 
                     dark:bg-orange-600 dark:hover:bg-orange-700 
                     text-white rounded-md disabled:opacity-50 
                     disabled:cursor-not-allowed transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>

      {loading && (
        <div className="mt-4 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
          <p className="text-gray-500 dark:text-gray-400">Thinking...</p>
        </div>
      )}

      {answer && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-md overflow-auto max-h-96 
                      border border-gray-200 dark:border-gray-700">
          <div className="text-gray-800 dark:text-gray-200 prose prose-sm max-w-none 
                        prose-headings:text-orange-600 dark:prose-headings:text-orange-400 
                        prose-headings:font-bold 
                        prose-p:text-gray-700 dark:prose-p:text-gray-300 
                        prose-li:marker:text-orange-500 dark:prose-li:marker:text-orange-400
                        prose-strong:text-gray-900 dark:prose-strong:text-gray-100
                        prose-code:text-orange-600 dark:prose-code:text-orange-400 
                        prose-code:bg-gray-100 dark:prose-code:bg-gray-800 
                        prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                        prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 
                        prose-pre:border dark:prose-pre:border-gray-700
                        prose-blockquote:border-l-orange-500 dark:prose-blockquote:border-l-orange-400
                        prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300
                        prose-a:text-orange-600 dark:prose-a:text-orange-400 
                        hover:prose-a:text-orange-700 dark:hover:prose-a:text-orange-300">
            <ReactMarkdown>{answer}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIQuery;