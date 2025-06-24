"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import StarRating from "@/app/components/StarRating";

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  rating: number | null;
  parentId?: string | null;
  user: { name?: string; email: string };
  replies: Comment[];
};

export default function CommentsSection() {
  const { data: session } = useSession();
  const { productId } = useParams();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);

  // For editing comments
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState(5);

  async function fetchComments() {
    const res = await fetch(`/api/comments?productId=${productId}`);
    if (res.ok) {
      const data = await res.json();
      setComments(data);
    } else {
      setComments([]);
    }
  }

  async function postComment() {
    if (!content.trim()) return;
    setLoading(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, content, rating }),
    });
    if (!res.ok) {
      let errorMsg = "Failed to post comment.";
      try {
        const errorData = await res.json();
        errorMsg = errorData.error || errorMsg;
      } catch {}
      alert(errorMsg);
      setLoading(false);
      return;
    }
    setContent("");
    setRating(5);
    await fetchComments();
    setLoading(false);
  }

  function startEdit(comment: Comment) {
    setEditingId(comment.id);
    setEditContent(comment.content);
    setEditRating(comment.rating ?? 5);
  }

  async function saveEdit(commentId: string) {
    setLoading(true);
    const res = await fetch(`/api/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent, rating: editRating }),
    });
    if (!res.ok) {
      let errorMsg = "Failed to update comment.";
      try {
        const errorData = await res.json();
        errorMsg = errorData.error || errorMsg;
      } catch {}
      alert(errorMsg);
      setLoading(false);
      return;
    }
    setEditingId(null);
    setEditContent("");
    setEditRating(5);
    await fetchComments();
    setLoading(false);
  }

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  return (
    <div className="mt-10 border-t pt-6">
      <h2 className="text-xl font-semibold mb-4">Comments</h2>

      {session ? (
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <label className="mr-2">Rating:</label>
            <StarRating
              value={rating}
              onChange={setRating}
              disabled={loading}
            />
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Write a comment..."
            className="w-full border p-2 rounded"
            disabled={loading}
          />
          <button
            onClick={postComment}
            disabled={loading || !content.trim()}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
          >
            {loading ? "Posting..." : "Post Comment"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-500">Please sign in to comment.</p>
      )}

      <div className="space-y-4">
        {comments.map((c) => (
          <div key={c.id} className="border p-4 rounded">
            {editingId === c.id ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold">
                    {c.user?.name || c.user?.email}
                  </span>
                  <StarRating value={editRating} onChange={setEditRating} />
                </div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="w-full border p-2 rounded mb-2"
                />
                <button
                  onClick={() => saveEdit(c.id)}
                  disabled={loading || !editContent.trim()}
                  className="bg-blue-600 text-white px-3 py-1 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="ml-2 text-gray-500 underline"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">
                    {c.user?.name || c.user?.email}
                  </p>
                  {/* Only show stars for top-level comments with a valid rating */}
                  {(!c.parentId || c.parentId === null) &&
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
                <p className="text-gray-800">{c.content}</p>
                <p className="text-xs text-gray-500">
                  {new Date(c.createdAt).toLocaleString()}
                </p>
                {session?.user?.email === c.user?.email &&
                  (!c.parentId || c.parentId === null) && (
                    <button
                      className="text-xs text-blue-500 underline mt-2"
                      onClick={() => startEdit(c)}
                    >
                      Edit
                    </button>
                  )}
              </>
            )}
            {/* Replies */}
            {c.replies?.length > 0 && (
              <div className="ml-6 mt-3 space-y-2">
                {c.replies.map((r) => (
                  <div key={r.id} className="bg-gray-100 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">
                        {r.user?.name || r.user?.email}
                      </p>
                      {/* Do NOT show stars for replies */}
                    </div>
                    <p>{r.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
