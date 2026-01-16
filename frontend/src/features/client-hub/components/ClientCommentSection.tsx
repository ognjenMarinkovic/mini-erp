import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { sr } from 'date-fns/locale';
import { Send, Loader2, Trash2, Paperclip, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { clientCommentsApi } from '../api/client-comments.api';
import type { Comment } from '@/features/kanban/api/comments.api';
import { useClientAuthStore } from '@/stores/client-auth-store';
import { RichTextEditor, RichTextViewer } from '@/components/RichTextEditor';

interface ClientCommentSectionProps {
  taskId: string;
}

export function ClientCommentSection({ taskId }: ClientCommentSectionProps) {
  const queryClient = useQueryClient();
  const { clientUser } = useClientAuthStore();
  const [newComment, setNewComment] = useState('');

  // Fetch komentari
  const { data: comments, isLoading } = useQuery({
    queryKey: ['client-comments', taskId],
    queryFn: () => clientCommentsApi.getByTask(taskId),
  });

  // Kreiranje komentara
  const createMutation = useMutation({
    mutationFn: (content: string) =>
      clientCommentsApi.create({ taskId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-comments', taskId] });
      setNewComment('');
    },
  });

  // Brisanje komentara
  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => clientCommentsApi.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-comments', taskId] });
    },
  });

  const handleSubmit = () => {
    const cleanContent = newComment.trim();
    if (cleanContent && cleanContent !== '<p></p>') {
      createMutation.mutate(cleanContent);
    }
  };

  const handleDelete = (commentId: string) => {
    if (window.confirm('Da li ste sigurni da želite da obrišete ovaj komentar?')) {
      deleteMutation.mutate(commentId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Lista komentara */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {comments?.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            Nema komentara. Budite prvi koji će ostaviti komentar.
          </p>
        ) : (
          comments?.map((comment) => (
            <ClientCommentItem
              key={comment.id}
              comment={comment}
              currentUserId={clientUser?.id}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Forma za novi komentar */}
      <div className="mt-4 border-t pt-4">
        <RichTextEditor
          content={newComment}
          onChange={setNewComment}
          placeholder="Napišite komentar... (koristi formatiranje)"
          className="mb-2"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!newComment.trim() || newComment === '<p></p>' || createMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Pošalji</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Komponenta za pojedinačni komentar
interface ClientCommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onDelete: (id: string) => void;
}

function ClientCommentItem({ comment, currentUserId, onDelete }: ClientCommentItemProps) {
  const isOwn = comment.authorId === currentUserId && comment.authorType === 'CLIENT';
  const isAdmin = comment.authorType === 'ADMIN';

  return (
    <div className={cn('group rounded-lg p-3', isOwn ? 'bg-purple-50' : 'bg-gray-50')}>
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white',
              isAdmin ? 'bg-blue-600' : 'bg-purple-600'
            )}
          >
            {comment.authorName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {comment.authorName}
              {isAdmin && (
                <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                  Tim
                </span>
              )}
            </p>
            <p className="text-xs text-gray-500">
              {format(new Date(comment.createdAt), "d. MMM yyyy 'u' HH:mm", {
                locale: sr,
              })}
            </p>
          </div>
        </div>

        {/* Actions - samo za svoje komentare */}
        {isOwn && (
          <button
            onClick={() => onDelete(comment.id)}
            className="rounded p-1 text-gray-400 opacity-0 hover:bg-gray-200 hover:text-red-500 group-hover:opacity-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      {comment.content && (
        <RichTextViewer content={comment.content} className="text-sm text-gray-700" />
      )}

      {/* Attachments */}
      {comment.attachments.length > 0 && (
        <div className="mt-3 space-y-2">
          {comment.attachments.map((attachment) => (
            <a
              key={attachment.id}
              href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/${attachment.filePath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              <Paperclip className="h-4 w-4 text-gray-400" />
              <span className="flex-1 truncate">{attachment.fileName}</span>
              <Download className="h-4 w-4 text-gray-400" />
            </a>
          ))}
        </div>
      )}

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="mt-3 border-l-2 border-gray-200 pl-4">
          {comment.replies.map((reply) => (
            <ClientCommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
