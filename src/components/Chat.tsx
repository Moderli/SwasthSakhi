'use client';

import { useChat } from 'ai/react';
import { ArrowUp } from 'lucide-react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-white rounded-lg border border-gray-200 shadow-md">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-center text-gray-800">AI Chat</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-4 py-2 rounded-lg max-w-xs lg:max-w-md ${m.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                <p className="text-sm">{m.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            className="flex-1 w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={input}
            onChange={handleInputChange}
            placeholder="Message"
            autoFocus
          />
          <button
            type="submit"
            className="p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 disabled:opacity-50"
            disabled={!input}
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
} 