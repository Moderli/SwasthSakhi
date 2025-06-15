'use client';

import { useState, FormEvent, ChangeEvent, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User as UserIcon, Bot } from 'lucide-react';
import Image from 'next/image';
import { useSupabase } from '@/app/supabase-provider';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const { session, supabase, isLoading } = useSupabase();
    const user = session?.user;
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkUserStatus = async () => {
            if (isLoading) return; // Don't check until session is loaded
            
            if (!user) {
                router.push('/login');
                return;
            }

            let isVerified = false;
            // The session storage flag is our primary, immediate check.
            if (sessionStorage.getItem('genderVerified') === 'true') {
                isVerified = true;
            } 
            // If the flag doesn't exist, we check the database for registered users.
            else if (!user.is_anonymous) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('is_verified')
                    .eq('id', user.id)
                    .single();
                isVerified = profile?.is_verified || false;
            }

            if (!isVerified) {
                router.push('/gender-check');
            }
        };

        checkUserStatus();
    }, [user, session, router, supabase, isLoading]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
        const currentMessages = [...messages, userMessage];
        setMessages(currentMessages);
        setInput('');
        setIsChatLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: currentMessages }),
            });

            if (!response.body) {
                throw new Error("No response body");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantMessageContent = '';
            const assistantMessageId = Date.now().toString();

            setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                assistantMessageContent += decoder.decode(value, { stream: true });
                
                setMessages(prev => {
                    const newMessages = [...prev];
                    const msgIndex = newMessages.findIndex(msg => msg.id === assistantMessageId);
                    if (msgIndex !== -1) {
                        newMessages[msgIndex].content = assistantMessageContent;
                    }
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Error fetching AI response:", error);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "Sorry, I'm having trouble connecting." }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        sessionStorage.removeItem('genderVerified');
        router.push('/');
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <aside className="w-64 bg-white p-6 flex flex-col justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-8">SwasthSakhi</h1>
                    <nav>
                        <ul>
                            <li className="mb-4"><a href="#" className="text-gray-700 font-semibold">Dashboard</a></li>
                            <li className="mb-4"><a href="#" className="text-gray-500">Profile</a></li>
                            <li className="mb-4"><a href="#" className="text-gray-500">Appointments</a></li>
                            <li className="mb-4"><a href="#" className="text-gray-500">Settings</a></li>
                        </ul>
                    </nav>
                </div>
                <button 
                    onClick={handleLogout}
                    className="w-full text-left text-red-500 font-semibold"
                >
                    Logout
                </button>
            </aside>

            <main className="flex-1 flex flex-col">
                 <div className="flex-1 flex flex-col h-full bg-white m-4 rounded-lg shadow">
                    <header className="p-4 border-b flex items-center justify-between">
                        <h2 className="text-xl font-bold">AI Chat</h2>
                        <div className="flex items-center gap-4">
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Voice call a doc</button>
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Video call a doc</button>
                        </div>
                    </header>
                    <div className="flex-1 p-4 overflow-y-auto" ref={messagesEndRef}>
                        <div className="space-y-4">
                            {messages.map((m) => (
                                <div key={m.id} className={`flex items-start gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
                                    {m.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                            <Bot size={20} className="text-gray-600"/>
                                        </div>
                                    )}
                                    <div className={`rounded-lg p-3 max-w-[75%] ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                                        <p className="text-sm">{m.content}</p>
                                    </div>
                                    {m.role === 'user' && user && !user.is_anonymous && user.user_metadata.avatar_url && (
                                        <Image src={user.user_metadata.avatar_url} alt="User" width={32} height={32} className="w-8 h-8 rounded-full" />
                                    )}
                                     {m.role === 'user' && user && (user.is_anonymous || !user.user_metadata.avatar_url) && (
                                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                            <UserIcon size={20} className="text-gray-600"/>
                                        </div>
                                    )}
                                </div>
                            ))}
                             {isChatLoading && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                        <Bot size={20} className="text-gray-600"/>
                                    </div>
                                    <div className="rounded-lg p-3 max-w-[75%] bg-gray-200">
                                        <p className="text-sm">...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <footer className="p-4 border-t">
                        <form onSubmit={handleSubmit} className="flex items-center gap-2">
                            <input
                                value={input}
                                onChange={handleInputChange}
                                placeholder="Type a message..."
                                disabled={isChatLoading}
                                className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button type="submit" disabled={isChatLoading} className="px-4 py-2 text-white bg-blue-500 rounded-md disabled:bg-blue-300">Send</button>
                        </form>
                    </footer>
                </div>
            </main>
        </div>
    );
} 