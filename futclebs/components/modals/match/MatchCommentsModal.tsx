import React, { useEffect, useState } from 'react';
import { api, MatchComment } from '../../../services/axios';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  currentUserId: string;
  isAdmin: boolean;
}

export const MatchCommentsModal: React.FC<Props> = ({ isOpen, onClose, matchId }) => {
  const [comments, setComments] = useState<MatchComment[]>([]);
  const [content, setContent] = useState('');

  const fetchComments = async () => {
    if (!matchId) return;
    const { data } = await api.get(`/matches/${matchId}/comments`);
    setComments(data || []);
  };

  useEffect(() => { if (isOpen) fetchComments(); }, [isOpen, matchId]);

  const addComment = async () => {
    if (!content.trim()) return;
    await api.post(`/matches/${matchId}/comments`, { content });
    setContent('');
    fetchComments();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] bg-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6">
        <h2 className="text-white font-bold mb-3">Comentários</h2>
        <div className="space-y-2 max-h-80 overflow-auto">
          {comments.map((c) => <div key={c.id} className="bg-slate-800 rounded p-2 text-sm text-slate-100">{c.content}</div>)}
        </div>
        <div className="mt-4 flex gap-2">
          <input value={content} onChange={(e) => setContent(e.target.value)} className="flex-1 bg-slate-800 rounded p-2" />
          <button onClick={addComment} className="px-3 py-2 bg-emerald-600 rounded">Enviar</button>
          <button onClick={onClose} className="px-3 py-2 bg-slate-700 rounded">Fechar</button>
        </div>
      </div>
    </div>
  );
};
