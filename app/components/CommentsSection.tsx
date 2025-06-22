"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  parentId?: string;
  user: { name?: string; email: string };
  replies: Comment[];
};

export default function CommentsSection() {
  const { data: session } = useSession();
  const { productId } = useParams();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchComments() {
    const res = await fetch(`/api/comments?productId=${productId}`);
    const data = await res.json();
    setComments(data);
  }

  async function postComment() {
    if (!content.trim()) return;
    setLoading(true);
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, content }),
    });
    setContent("");
    fetchComments();
    setLoading(false);
  }

  useEffect(() => {
    fetchComments();
  }, [productId]);

  return (
    <div className="mt-10 border-t pt-6">
      <h2 className="text-xl font-semibold mb-4">Comments</h2>

      {session ? (
        <div className="mb-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Write a comment..."
            className="w-full border p-2 rounded"
          />
          <button
            onClick={postComment}
            disabled={loading}
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
            <p className="text-sm font-semibold">
              {c.user.name || c.user.email}
            </p>
            <p className="text-gray-800">{c.content}</p>
            <p className="text-xs text-gray-500">
              {new Date(c.createdAt).toLocaleString()}
            </p>

            {/* Replies */}
            {c.replies?.length > 0 && (
              <div className="ml-6 mt-3 space-y-2">
                {c.replies.map((r) => (
                  <div key={r.id} className="bg-gray-100 p-2 rounded">
                    <p className="text-sm font-semibold">
                      {r.user.name || r.user.email}
                    </p>
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
