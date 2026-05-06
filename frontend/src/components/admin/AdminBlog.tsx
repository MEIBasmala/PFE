import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { BlogArticle } from '@/types/api';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Skeleton,
  ConfirmDialog,
} from '@/components/ui';

type Filter = 'All Posts' | 'Published' | 'Drafts' | 'Scheduled';
const filters: Filter[] = ['All Posts', 'Published', 'Drafts', 'Scheduled'];

const getStatusClasses = (status: string) => {
  if (status === 'PUBLISHED') return 'bg-secondary text-secondary-foreground border-0';
  if (status === 'DRAFT') return 'bg-muted text-muted-foreground border-0';
  return 'bg-primary/10 text-primary border-0'; // SCHEDULED
};



const getStatusLabel = (status: string): string => {
  if (status === 'PUBLISHED') return 'Published';
  if (status === 'DRAFT') return 'Draft';
  return 'Scheduled';
};

const AdminBlog = () => {
  const [posts, setPosts] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('All Posts');
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ title: '', category: '', content: '', coverImage: '' });
  const [editPost, setEditPost] = useState<BlogArticle | null>(null);
  const [editForm, setEditForm] = useState({ title: '', category: '', content: '', coverImage: '', status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' });
  const [deleteConfirm, setDeleteConfirm] = useState<BlogArticle | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; posts: BlogArticle[] }>('/admin/blog');
      setPosts(res.posts);
    } catch {
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const filtered = filter === 'All Posts' ? posts : posts.filter(p => {
    if (filter === 'Drafts') return p.status === 'DRAFT';
    if (filter === 'Published') return p.status === 'PUBLISHED';
    if (filter === 'Scheduled') return (p.status as string) === 'SCHEDULED';
    return true;
  });

  const handleCreate = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!newForm.title || !newForm.content) {
      toast.error('Title and content are required');
      return;
    }
    try {
      const res = await api.post<{ success: boolean; post: BlogArticle }>('/admin/blog', {
        title: newForm.title,
        content: newForm.content,
        category: newForm.category,
        coverImage: newForm.coverImage,
        status,
      });
      setPosts(prev => [res.post, ...prev]);
      setShowNew(false);
      setNewForm({ title: '', category: '', content: '', coverImage: '' });
      toast.success(`Post ${status === 'PUBLISHED' ? 'published' : 'saved as draft'}`);
    } catch {
      toast.error('Failed to create post');
    }
  };

  const openEdit = (p: BlogArticle) => {
    setEditPost(p);
    setEditForm({
      title: p.title,
      category: p.category || '',
      content: p.content,
      coverImage: p.coverImage || '',
      status: p.status,
    });
  };

  const saveEdit = async () => {
    if (!editPost) return;
    try {
      const res = await api.put<{ success: boolean; post: BlogArticle }>(`/admin/blog/${editPost.id}`, editForm);
      setPosts(prev => prev.map(p => p.id === editPost.id ? res.post : p));
      setEditPost(null);
      toast.success('Post updated');
    } catch {
      toast.error('Failed to update post');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/admin/blog/${deleteConfirm.id}`);
      setPosts(prev => prev.filter(p => p.id !== deleteConfirm.id));
      toast.success('Post deleted');
      setDeleteConfirm(null);
    } catch {
      toast.error('Failed to delete post');
    }
  };

  if (loading) {
    return (
      <div className="page-enter space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
        <Button onClick={() => setShowNew(true)} className="w-full sm:w-auto">
          New Post
        </Button>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No posts found.
            </CardContent>
          </Card>
        ) : (
          filtered.map(post => (
            <Card key={post.id}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <h3 className="mb-1 text-base font-semibold">{post.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString()
                          : 'Not published'}
                      </span>
                      <span>·</span>
                      <span>{post.category || 'Uncategorized'}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={getStatusClasses(post.status)}>
                      {getStatusLabel(post.status)}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(post)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleteConfirm(post)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New Post Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90dvh] overflow-y-auto">

          <DialogHeader>
            <DialogTitle>Create New Blog Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newForm.title}
                onChange={e => setNewForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Post title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Input
                value={newForm.category}
                onChange={e => setNewForm(p => ({ ...p, category: e.target.value }))}
                placeholder="Category (optional)"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                rows={6}
                value={newForm.content}
                onChange={e => setNewForm(p => ({ ...p, content: e.target.value }))}
                placeholder="Write your post content..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cover Image URL</label>
              <Input
                value={newForm.coverImage}
                onChange={e => setNewForm(p => ({ ...p, coverImage: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleCreate('DRAFT')}
              className="bg-secondary text-secondary-foreground hover:bg-accent"
            >
              Save Draft
            </Button>            <Button onClick={() => handleCreate('PUBLISHED')}>Publish Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editPost} onOpenChange={() => setEditPost(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editForm.title}
                onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Input
                value={editForm.category}
                onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                rows={6}
                value={editForm.content}
                onChange={e => setEditForm(p => ({ ...p, content: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cover Image URL</label>
              <Input
                value={editForm.coverImage}
                onChange={e => setEditForm(p => ({ ...p, coverImage: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={editForm.status}
                onValueChange={(val: 'DRAFT' | 'PUBLISHED') =>
                  setEditForm(p => ({ ...p, status: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setEditPost(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
        title="Delete Post"
        description={`Are you sure you want to delete "${deleteConfirm?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default AdminBlog;