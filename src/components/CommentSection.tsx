import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Reply } from "lucide-react";
import { toast } from "sonner";

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  replies?: Comment[];
}

export const CommentSection = () => {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      author: "Rajesh Kumar",
      content: "Great review! Very helpful for choosing the right chimney.",
      timestamp: "2 hours ago",
      replies: [
        {
          id: "2",
          author: "Article Author",
          content: "Thank you! Glad you found it helpful.",
          timestamp: "1 hour ago",
        },
      ],
    },
  ]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: "Guest User",
      content: newComment,
      timestamp: "Just now",
      replies: [],
    };

    setComments([comment, ...comments]);
    setNewComment("");
    toast.success("Comment posted successfully!");
  };

  const handleAddReply = (commentId: string) => {
    if (!replyText.trim()) return;

    const reply: Comment = {
      id: Date.now().toString(),
      author: "Guest User",
      content: replyText,
      timestamp: "Just now",
    };

    setComments(
      comments.map((comment) =>
        comment.id === commentId
          ? { ...comment, replies: [...(comment.replies || []), reply] }
          : comment
      )
    );

    setReplyText("");
    setReplyingTo(null);
    toast.success("Reply posted successfully!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Comments ({comments.length})</h2>
      </div>

      {/* Add Comment */}
      <Card className="p-4">
        <Textarea
          placeholder="Share your thoughts..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="mb-3"
          rows={3}
        />
        <Button onClick={handleAddComment} className="bg-gradient-primary">
          Post Comment
        </Button>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id} className="p-4">
            <div className="flex gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {comment.author.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">{comment.author}</span>
                  <span className="text-sm text-muted-foreground">{comment.timestamp}</span>
                </div>
                <p className="text-foreground mb-2">{comment.content}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(comment.id)}
                  className="text-primary hover:text-primary/80"
                >
                  <Reply className="w-4 h-4 mr-1" />
                  Reply
                </Button>

                {/* Reply Form */}
                {replyingTo === comment.id && (
                  <div className="mt-3 pl-4 border-l-2 border-border">
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="mb-2"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAddReply(comment.id)}
                        className="bg-gradient-primary"
                      >
                        Post Reply
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-3 pl-4 border-l-2 border-border space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                            {reply.author.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-foreground">
                              {reply.author}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {reply.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};