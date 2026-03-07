import React, { useState, useEffect, useCallback } from 'react';
import { authFetch } from '../lib/authClient';

const InviteModal = ({ isOpen, onClose, projectId, onInviteSuccess }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [role, setRole] = useState('Participant');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults([]);
            setSelectedUser(null);
            setRole('Participant');
            setError('');
        }
    }, [isOpen]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query.trim().length > 0) {
                fetchUsers(query.trim());
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const fetchUsers = async (searchQuery) => {
        setIsLoading(true);
        try {
            const response = await authFetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
            if (response.ok) {
                const data = await response.json();
                setResults(data);
            }
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setQuery(user.email);
        setResults([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedUser) {
            setError('Please select a user to invite.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await authFetch(`/api/project-management/${projectId}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: selectedUser.id,
                    role: role
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || 'Failed to send invite.');
            }

            if (onInviteSuccess) onInviteSuccess();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to send invite.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
            <div className="bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#333]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Invite someone</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2 relative">
                        <label className="text-sm text-gray-400 font-medium">To:</label>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                if (selectedUser) setSelectedUser(null);
                            }}
                            placeholder="Email address or username..."
                            className="w-full bg-[#2A2A2A] text-white rounded-xl px-4 py-3 outline-none border border-transparent focus:border-[#4ADE80] transition-colors"
                        />
                        {isLoading && (
                            <div className="absolute right-4 top-10 text-gray-400">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        )}

                        {results.length > 0 && !selectedUser && (
                            <div className="absolute w-full mt-1 bg-[#2A2A2A] border border-[#333] rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto overflow-x-hidden">
                                {results.map(user => (
                                    <div
                                        key={user.id}
                                        onClick={() => handleSelectUser(user)}
                                        className="px-4 py-3 hover:bg-[#333] flex items-center space-x-3 cursor-pointer transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4ADE80] to-[#3B82F6] flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                                            {user.profileImageUrl ? (
                                                <img src={user.profileImageUrl} alt="avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                user.username.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium leading-none">{user.username}</p>
                                            <p className="text-gray-400 text-xs mt-1 leading-none">{user.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 font-medium">Role:</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-[#2A2A2A] text-white rounded-xl px-4 py-3 outline-none border border-transparent focus:border-[#4ADE80] transition-colors appearance-none"
                        >
                            <option value="Admin">Admin - Full access</option>
                            <option value="Organizer">Organizer - Manage tasks</option>
                            <option value="Participant">Participant - Update task status</option>
                            <option value="Viewer">Viewer - Read only</option>
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-gray-400 text-sm font-medium hover:text-white transition-colors mr-3"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedUser || isSubmitting}
                            className={`px-5 py-2.5 rounded-xl text-black text-sm font-bold transition-all transform active:scale-95 ${!selectedUser || isSubmitting
                                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                : 'bg-[#4ADE80] hover:bg-[#38bdf8] shadow-[0_0_15px_rgba(74,222,128,0.3)]'
                                }`}
                        >
                            {isSubmitting ? 'Sending...' : 'Send Invite'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InviteModal;
