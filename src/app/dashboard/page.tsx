'use client';

import { useState, FormEvent, ChangeEvent, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User as UserIcon, Bot, Paperclip, X, Menu } from 'lucide-react';
import Image from 'next/image';
import { useSupabase } from '@/app/supabase-provider';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    image?: string;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export default function DashboardPage() {
    const router = useRouter();
    const { session, supabase, isLoading } = useSupabase();
    const user = session?.user;
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() && !imageFile) return;

        const userMessage: Message = { 
            id: Date.now().toString(), 
            role: 'user', 
            content: input,
        };
        
        if (imageFile && imagePreview) {
            userMessage.image = imagePreview;
        }

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        
        const image = imageFile ? await fileToBase64(imageFile) : null;
        
        setInput('');
        setImageFile(null);
        setImagePreview(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setIsChatLoading(true);

        try {
            const apiMessages = newMessages.map(msg => ({
                role: msg.role,
                content: msg.content,
                ...(msg.image && msg.role === 'user' && { image }),
            })).filter(msg => msg.role !== 'assistant');

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: apiMessages }),
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
        <div className="relative flex h-screen bg-gray-100 overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            <div className={`fixed inset-0 bg-gray-900 bg-opacity-50 z-40 transition-opacity md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)}></div>

            <aside className={`absolute top-0 left-0 h-full w-64 bg-white p-6 flex flex-col justify-between transform transition-transform duration-300 ease-in-out z-50 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-2xl font-bold">SwasthSakhi</h1>
                         <button
                            className="p-1 text-gray-600 md:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <X size={24} />
                        </button>
                    </div>
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
                 <div className="flex-1 flex flex-col h-full bg-white md:m-4 md:rounded-lg shadow-md">
                    <header className="p-4 border-b flex items-center justify-between">
                        <div className="flex items-center">
                            <button
                                className="mr-4 p-1 text-gray-600 md:hidden"
                                onClick={() => setIsSidebarOpen(true)}
                            >
                                <Menu size={24} />
                            </button>
                            <h2 className="text-xl font-bold">AI Chat</h2>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                            <button className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Voice call</button>
                            <button className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Video call</button>
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
                                    <div className={`rounded-lg p-3 max-w-[75%] ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'}`}>
                                        {m.image && (
                                            <Image src={m.image} alt="User upload" width={200} height={200} className="rounded-md mb-2"/>
                                        )}
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
                        {imagePreview && (
                            <div className="mb-2 relative w-24 h-24 rounded-md overflow-hidden">
                                <Image src={imagePreview} alt="Image preview" layout="fill" objectFit="cover" />
                                <button
                                    onClick={handleRemoveImage}
                                    className="absolute top-1 right-1 bg-gray-900 bg-opacity-50 text-white rounded-full p-1"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="flex items-center gap-2">
                             <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                ref={fileInputRef}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-gray-500 hover:text-gray-700"
                            >
                                <Paperclip size={20} />
                            </button>
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