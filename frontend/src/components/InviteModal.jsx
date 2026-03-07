import React, { useState, useEffect } from 'react';
import { authFetch } from '../lib/authClient';
import { toast } from 'react-toastify';

const InviteModal = ({ isOpen, onClose, projectId, onInviteSuccess }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [role, setRole] = useState('Participant');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults([]);
            setSelectedUser(null);
            setRole('Participant');
        }
    }, [isOpen]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query.trim().length > 0 && !selectedUser) {
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
            toast.error('Please select a user to invite.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await authFetch(`/api/project-management/${projectId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedUser.id, role: role })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || 'Failed to send invite.');
            }

            toast.success(`${selectedUser.username} invited as ${role} successfully!`);
            if (onInviteSuccess) onInviteSuccess();
            onClose();
        } catch (err) {
            toast.error(err.message || 'Failed to send invite.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Invite someone</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5 relative">
                        <label className="text-sm text-slate-600 font-semibold">To:</label>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                if (selectedUser) setSelectedUser(null);
                            }}
                            placeholder="Email address or username..."
                            className="w-full bg-slate-50 text-slate-900 rounded-xl px-4 py-3 outline-none border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                        />
                        {isLoading && (
                            <div className="absolute right-4 top-10 text-slate-400">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        )}

                        {results.length > 0 && !selectedUser && (
                            <div className="absolute w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                                {results.map(user => (
                                    <div
                                        key={user.id}
                                        onClick={() => handleSelectUser(user)}
                                        className="px-4 py-3 hover:bg-slate-50 flex items-center gap-3 cursor-pointer transition-colors border-b border-slate-50 last:border-b-0"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                            {user.profileImageUrl ? (
                                                <img src={user.profileImageUrl} alt="avatar" className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                user.username.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-slate-900 text-sm font-semibold leading-none truncate">{user.username}</p>
                                            <p className="text-slate-500 text-xs mt-1 leading-none truncate">{user.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm text-slate-600 font-semibold">Role:</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-slate-50 text-slate-900 rounded-xl px-4 py-3 outline-none border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium cursor-pointer appearance-none"
                        >
                            <option value="Admin">Admin - Full access</option>
                            <option value="Organizer">Organizer - Manage tasks</option>
                            <option value="Participant">Participant - Update task status</option>
                            <option value="Viewer">Viewer - Read only</option>
                        </select>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedUser || isSubmitting}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all transform active:scale-95 ${!selectedUser || isSubmitting
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20'
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
