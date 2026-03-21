import { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

export default function ChatInterface() {
    const { user } = useContext(AuthContext);
    const messagesEndRef = useRef(null);
    
    // State to hold the conversation history
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Set an initial welcome message when user context becomes available
    useEffect(() => {
        if (!user) return;

        const greeting = {
            id: 1,
            text: `Hi ${user.name || 'there'}! I'm ChronosAI. How can I help you schedule your meetings today?`,
            sender: 'bot'
        };

        setMessages([greeting]);
    }, [user]);

    // Auto-scroll to the bottom whenever messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle sending a message
    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userText = input.trim();
        
        // 1. Add user's message to the UI instantly
        const newMessage = { id: Date.now(), text: userText, sender: 'user' };
        setMessages((prev) => [...prev, newMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // 2. Send the message to our Node.js Backend (which talks to Python)
            const response = await api.post('/chat', { message: userText });
            
            // 3. Add the AI's response to the UI
            const botText = response.data?.reply || response.data?.message || 'Received response but no text was available.';
            const botMessage = { 
                id: Date.now() + 1, 
                text: botText,
                sender: 'bot' 
            };
            setMessages((prev) => [...prev, botMessage]);

        } catch (error) {
            console.error("Chat error:", error.response?.status, error.response?.data || error.message);

            const botMessage = {
                id: Date.now() + 1,
                text: error.response
                    ? `Error ${error.response.status}: ${error.response.data?.message || JSON.stringify(error.response.data)}`
                    : "Sorry, I'm having trouble connecting to my brain right now. Please try again.",
                sender: 'bot',
                isError: true
            };
            setMessages((prev) => [...prev, botMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] w-full bg-white border border-gray-200 rounded-xl shadow-sm">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-blue-50 rounded-t-xl">
                <h2 className="font-semibold text-blue-800 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    ChronosAI Assistant
                </h2>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 text-sm rounded-2xl ${
                            msg.sender === 'user' 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : msg.isError 
                                    ? 'bg-red-100 text-red-800 rounded-bl-none'
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                
                {/* Typing Indicator */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                )}
                {/* Invisible div to anchor our auto-scroll */}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
                <form onSubmit={handleSend} className="flex space-x-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Schedule a 30 min meeting with John tomorrow at 2 PM..."
                        className="flex-1 p-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}