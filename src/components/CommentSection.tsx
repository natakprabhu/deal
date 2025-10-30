import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Edit, Trash2, Send } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Comment {
  id: string;
  article_id: string;
  user_name: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  parent_comment_id: string | null;
  profiles: {
    full_name: string;
  } | null;
  replies?: Comment[];
}

interface CommentSectionProps {
  articleId: string;
}

export const CommentSection = ({ articleId }: CommentSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);

  const isValidUUID = (str: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(str);

  const fetchComments = async () => {
    if (!articleId || !isValidUUID(articleId)) return;

    setLoading(true);
    try {
      // 1️⃣ Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("*")
        .eq("article_id", articleId)
        .order("created_at", { ascending: false });

      if (commentsError) throw commentsError;

      // 2️⃣ Fetch profiles
      const userIds = commentsData.map(c => c.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // 3️⃣ Merge profiles
      const mergedComments = commentsData.map(comment => ({
        ...comment,
        profiles: profilesData.find(p => p.id === comment.user_id) || null,
      }));

      setComments(mergedComments);
    } catch (err: any) {
      console.error("Error fetching comments:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch comments.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [articleId]);

const handleCommentSubmit = async () => {

  const { data, error } = await supabase.from("comments").insert({
    article_id: articleId,
    user_name: user.email,
    user_id: user.id,
    comment_text: newComment,
    parent_comment_id: replyingToCommentId || null,
  });

  if (error) {
    console.error("Insert error:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to post comment.",
    });
  } else {
    setNewComment("");
    setReplyingToCommentId(null);
    fetchComments();
    toast({
      title: "Success",
      description: "Comment posted.",
    });
  }
};


  const handleEditClick = (comment: Comment) => {
    setEditingComment(comment);
    setEditText(comment.comment_text);
  };

  const handleUpdateSubmit = async (commentId: string) => {
    if (editText.trim() === "") return;

    const { error } = await supabase
      .from("comments")
      .update({ comment_text: editText })
      .eq("id", commentId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update comment.",
      });
    } else {
      toast({
        title: "Success",
        description: "Comment updated.",
      });
      setEditingComment(null);
      fetchComments();
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteCommentId) return;

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", deleteCommentId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete comment.",
      });
    } else {
      toast({
        title: "Success",
        description: "Comment deleted.",
      });
      setDeleteCommentId(null);
      fetchComments();
    }
  };

  const renderComment = (comment: Comment) => {
    const isAuthor = user && user.id === comment.user_id;
    const isEditing = editingComment && editingComment.id === comment.id;

    return (
      <div key={comment.id} className="flex space-x-3">
        <Avatar>
          <AvatarImage src={comment.profiles?.full_name ? "" : ""} />
          <AvatarFallback>{comment.profiles?.full_name?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">
              {comment.profiles?.full_name || "Anonymous"}
            </h4>
            <span className="text-xs text-muted-foreground">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleUpdateSubmit(comment.id)}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingComment(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm">{comment.comment_text}</p>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setReplyingToCommentId(comment.id)}
            >
              Reply
            </Button>

            {isAuthor && !isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleEditClick(comment)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive hover:text-destructive"
                  onClick={() => setDeleteCommentId(comment.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        Comments ({comments.length})
      </h3>
      {user ? (
        <div className="space-y-2">
          <Textarea
            placeholder={
              replyingToCommentId
                ? "Write a reply..."
                : "Write a comment..."
            }
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Button onClick={handleCommentSubmit} disabled={newComment.trim() === ""}>
            <Send className="h-4 w-4 mr-2" />
            {replyingToCommentId ? "Post Reply" : "Post Comment"}
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground">You must be logged in to post a comment.</p>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          comments.map(renderComment)
        )}
      </div>

      <AlertDialog open={!!deleteCommentId} onOpenChange={() => setDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your comment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubmit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
