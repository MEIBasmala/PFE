export interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  accent: string;
  progress?: number;
  extra?: React.ReactNode;
  action?: { label: string; onClick: () => void };
}
