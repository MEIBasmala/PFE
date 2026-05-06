import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { Inquiry } from '@/types/api';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  Button,
  Badge,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Skeleton,
} from '@/components/ui';

type Filter = 'All' | 'Unread' | 'Resolved';

const AdminInquiries = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('All');
  const [replyTo, setReplyTo] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const filters: Filter[] = ['All', 'Unread', 'Resolved'];

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; inquiries: Inquiry[] }>('/inquiries');
      setInquiries(res.inquiries);
    } catch {
      toast.error('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInquiries(); }, []);

  const filtered = filter === 'All' ? inquiries : inquiries.filter(inq => {
    if (filter === 'Unread') return inq.status === 'UNREAD';
    if (filter === 'Resolved') return inq.status === 'RESOLVED';
    return true;
  });

  const handleReply = async () => {
    if (!replyTo || !replyText.trim()) {
      toast.error('Please type a reply');
      return;
    }
    try {
      await api.put(`/inquiries/${replyTo.id}/reply`, { reply: replyText });
      await fetchInquiries();
      toast.success('Reply sent');
      setReplyTo(null);
      setReplyText('');
    } catch {
      toast.error('Failed to send reply');
    }
  };

  if (loading) {
    return (
      <div className="page-enter space-y-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-16" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      {/* Filter buttons */}
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

      {/* Inquiries list */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No inquiries found.
            </CardContent>
          </Card>
        ) : (
          filtered.map(inq => (
            <Card key={inq.id}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:justify-between">
                  <div className="flex-1">
                    <h3 className="mb-1 text-base font-semibold">{inq.subject}</h3>
                    <div className="mb-2 text-sm text-muted-foreground">
                      <div>
                        From:{' '}
                        <span className="font-medium text-foreground">
                          {inq.patient?.user.fullName ?? `Patient #${inq.patientId}`}
                        </span>
                        {inq.patient?.user.email && (
                          <span className="ml-1 text-xs">({inq.patient.user.email})</span>
                        )}
                      </div>
                      <div>Received: {new Date(inq.submittedAt).toLocaleString()}</div>
                    </div>
                    <p className="mb-3 whitespace-pre-wrap text-sm">{inq.message}</p>
                    {inq.reply && (
                      <div className="mt-3 rounded-lg bg-secondary/40 border border-secondary p-3">
                        <p className="text-sm font-semibold text-secondary-foreground">Admin Reply:</p>
                        <p className="text-sm text-muted-foreground">{inq.reply}</p>
                        {inq.repliedAt && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(inq.repliedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={
                        inq.status === 'UNREAD'
                          ? 'bg-primary/10 text-primary border-0'
                          : 'bg-secondary text-secondary-foreground border-0'
                      }
                    >
                      {inq.status === 'UNREAD' ? 'Pending' : 'Resolved'}
                    </Badge>
                    {inq.status !== 'RESOLVED' && (
                      <Button
                        size="sm"
                        className="bg-secondary text-secondary-foreground hover:bg-accent"
                        onClick={() => setReplyTo(inq)}
                      >
                        Reply
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reply Dialog */}
      <Dialog open={!!replyTo} onOpenChange={() => setReplyTo(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Reply to {replyTo?.patient?.user.fullName ?? `Patient #${replyTo?.patientId}`}
            </DialogTitle>          </DialogHeader>
          {replyTo && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm font-semibold">Original Message:</p>
                <div className="mt-1 rounded-md bg-muted p-2 text-sm">
                  {replyTo.message}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Your Reply</label>
                <Textarea
                  rows={5}
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setReplyTo(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleReply}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Send Reply
            </Button>          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInquiries;