import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { toast } from 'sonner';
import type { AuditLog } from '@/types/api';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Skeleton,
} from '@/components/ui';

const getActionColor = (action: string) => {
  if (action.startsWith('DELETE')) return 'bg-destructive/10 text-destructive';
  if (action.startsWith('DEACTIVATE')) return 'bg-muted text-muted-foreground';
  if (action.startsWith('ACTIVATE')) return 'bg-secondary text-secondary-foreground';
  if (action.startsWith('CREATE')) return 'bg-primary/10 text-primary';
  return 'bg-muted text-muted-foreground';
};


const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get<{ success: boolean; logs: AuditLog[] }>('/admin/audit-logs');
        setLogs(res.logs);
      } catch {
        toast.error('Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="page-enter space-y-4">
        <Skeleton className="h-8 w-40" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-4">
      <Card>
        <CardHeader>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">  
            <Table className="min-w-[560px]">       
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {log.admin.user.fullName[0]}
                        </div>
                        {log.admin.user.fullName}
                      </div>
                    </TableCell>                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium max-w-[160px] truncate sm:max-w-none ${getActionColor(log.action)}`}
                        title={log.action}
                      >
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {log.targetType} #{log.targetId}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(log.performedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No audit logs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuditLogs;