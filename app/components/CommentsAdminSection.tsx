/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import StarRating from "@/app/components/StarRating";

type Comment = {
  id: string;
  content: string;
  rating: number | null;
  createdAt: string;
  user: { name?: string; email: string };
  replies: Comment[];
  parentId?: string | null;
};

type CommentsAdminSectionProps = {
  productId: string;
  onClose: () => void;
};

export default function CommentsAdminSection({
  productId,
  onClose,
}: CommentsAdminSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // For editing comments and replies
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState<number>(5); // Only for top-level

  async function fetchComments() {
    const res = await fetch(`/api/comments?productId=${productId}`);
    if (res.ok) {
      const data = await res.json();
      setComments(data || []);
    } else {
      setComments([]);
    }
  }

  async function submitReply(parentId: string) {
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        content: replyContent,
        parentId,
      }),
    });
    setReplyContent("");
    setReplyingTo(null);
    fetchComments();
  }

  async function deleteComment(commentId: string) {
    if (!window.confirm("Delete this comment?")) return;
    await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    fetchComments();
  }

  function startEdit(comment: Comment) {
    setEditingId(comment.id);
    setEditContent(comment.content);
    setEditRating(comment.rating ?? 5);
  }

  async function saveEdit(comment: Comment) {
    // Only send rating for top-level comments
    const body: any = { content: editContent };
    if (!comment.parentId) {
      body.rating = editRating;
    }
    await fetch(`/api/comments/${comment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setEditingId(null);
    setEditContent("");
    setEditRating(5);
    fetchComments();
  }

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line
  }, [productId]);

  return (
    <div>
      {comments.length === 0 ? (
        <p className="text-gray-500 mb-4">No comments yet.</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="border p-4 mb-2 rounded">
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {c.user?.name || c.user?.email}
              </span>
              {/* Only show star rating for top-level reviews with valid rating */}
              {c.parentId == null &&
                typeof c.rating === "number" &&
                c.rating >= 1 &&
                c.rating <= 5 && (
                  <StarRating
                    value={c.rating}
                    onChange={() => {}}
                    disabled
                    size={16}
                  />
                )}
            </div>
            {editingId === c.id ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {/* Only show StarRating for top-level comments */}
                  {c.parentId == null && (
                    <StarRating value={editRating} onChange={setEditRating} />
                  )}
                </div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="w-full border p-2 rounded mb-2"
                />
                <button onClick={() => saveEdit(c)} className="btn btn-primary">
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="ml-2 text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <p>{c.content}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setReplyingTo(c.id)}
                    className="text-xs text-blue-500 underline"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="text-xs text-red-500 underline"
                  >
                    Delete
                  </button>
                  {session?.user?.email === c.user?.email && (
                    <button
                      className="text-xs text-blue-500 underline"
                      onClick={() => startEdit(c)}
                    >
                      Edit
                    </button>
                  )}
                </div>
              </>
            )}
            {replyingTo === c.id && (
              <div className="mt-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="w-full border p-2 rounded"
                  rows={2}
                />
                <button
                  onClick={() => submitReply(c.id)}
                  className="btn btn-primary mt-1"
                >
                  Send Reply
                </button>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="ml-2 text-xs"
                >
                  Cancel
                </button>
              </div>
            )}
            {/* Show replies */}
            {c.replies && c.replies.length > 0 && (
              <div className="ml-6 mt-2">
                {c.replies.map((r) => (
                  <div key={r.id} className="bg-gray-100 p-2 rounded mb-1">
                    <span className="font-semibold">
                      {r.user?.name || r.user?.email}
                    </span>
                    {editingId === r.id ? (
                      <>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full border p-2 rounded my-2"
                        />
                        <button
                          onClick={() => saveEdit(r)}
                          className="btn btn-primary"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="ml-2 text-xs"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <p>{r.content}</p>
                        {session?.user?.email === r.user?.email && (
                          <button
                            className="text-xs text-blue-500 underline mt-2"
                            onClick={() => {
                              setEditingId(r.id);
                              setEditContent(r.content);
                            }}
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => deleteComment(r.id)}
                          className="text-xs text-red-500 underline ml-2"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
