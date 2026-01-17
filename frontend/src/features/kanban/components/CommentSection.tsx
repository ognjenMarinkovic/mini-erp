import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { sr } from 'date-fns/locale';
import { Send, Loader2, Trash2, Paperclip, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { commentsApi, type Comment } from '../api/comments.api';
import { RichTextEditor, RichTextViewer } from '@/components/RichTextEditor';

interface CommentSectionProps {
  taskId: string;
  currentUserId?: string;
  currentUserType?: 'ADMIN' | 'CLIENT';
}

export function CommentSection({ taskId, currentUserId, currentUserType }: CommentSectionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  // Fetch komentari
  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentsApi.getByTask(taskId),
  });

  // Kreiranje komentara
  const createMutation = useMutation({
    mutationFn: (content: string) =>
      commentsApi.create({ taskId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      setNewComment('');
    },
  });

  // Brisanje komentara
  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => commentsApi.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
    },
  });

  const handleSubmit = () => {
    const cleanContent = newComment.trim();
    if (cleanContent && cleanContent !== '<p></p>') {
      createMutation.mutate(cleanContent);
    }
  };

  const handleDelete = (commentId: string) => {
    if (window.confirm(t('common.confirmDelete'))) {
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
          <p className="text-center text-sm text-gray-400 py-8">
            {t('common.noComments')}. {t('common.beFirst')}
          </p>
        ) : (
          comments?.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              currentUserType={currentUserType}
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
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  currentUserType?: 'ADMIN' | 'CLIENT';
  onDelete: (id: string) => void;
}

function CommentItem({ comment, currentUserId, currentUserType, onDelete }: CommentItemProps) {
  const isOwn = comment.authorId === currentUserId && comment.authorType === currentUserType;
  const isAdmin = comment.authorType === 'ADMIN';

  return (
    <div className={cn('group rounded-lg p-3', isOwn ? 'bg-blue-50' : 'bg-gray-50')}>
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
                  Admin
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

        {/* Actions */}
        {(isOwn || currentUserType === 'ADMIN') && (
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
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              currentUserType={currentUserType}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
