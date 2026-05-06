// src/components/patient/PatientSupport.tsx
import { useState } from "react";
import { Headset, MessageCircle, Send } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { getMyInquiries, submitInquiry } from "@/services/api";
import { formatShortDate } from "@/lib/date";
import { toast } from "sonner";
import type { Inquiry } from "@/types/api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Textarea,
  Badge,
  Skeleton,
} from "@/components/ui";

// Helper to extract inquiries array from API response
const fetchMyInquiries = async (): Promise<Inquiry[]> => {
  const res = await getMyInquiries();
  // API returns { success: boolean, inquiries: Inquiry[] }
  return Array.isArray(res) ? res : (res as any)?.inquiries ?? [];
};

export default function Support() {
  const inquiries = useAsync(fetchMyInquiries, [], { toastOnError: false });
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!subject || !message) {
      toast.error("Please fill in both fields.");
      return;
    }
    setSending(true);
    try {
      await submitInquiry({ subject, message });
      toast.success("Inquiry sent");
      setSubject("");
      setMessage("");
      await inquiries.refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: Inquiry["status"]) => {
    switch (status) {
      case "UNREAD": return <Badge variant="secondary">Open</Badge>;
      case "RESOLVED": return <Badge variant="default">Resolved</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Safely get the array – fallback to empty array
  const inquiriesList = Array.isArray(inquiries.data) ? inquiries.data : [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Contact form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headset className="h-5 w-5 text-primary" /> Contact us
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What's it about?"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us how we can help…"
            />
          </div>
          <Button onClick={send} disabled={sending} className="w-full sm:w-auto">
            <Send className="mr-2 h-4 w-4" /> {sending ? "Sending…" : "Send inquiry"}
          </Button>
        </CardContent>
      </Card>

      {/* My inquiries list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" /> My inquiries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inquiries.loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : inquiriesList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No inquiries yet.</p>
          ) : (
            <ul className="space-y-3">
              {inquiriesList.map((inq) => (
                <li key={inq.id} className="rounded-lg border border-border p-3">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{formatShortDate(inq.submittedAt)}</span>
                    {getStatusBadge(inq.status)}
                  </div>
                  <div className="text-sm font-semibold">{inq.subject}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{inq.message}</p>
                  {inq.reply && (
                    <div className="mt-2 rounded-md bg-primary/10 p-2 text-sm">
                      <strong>Reply:</strong> {inq.reply}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}