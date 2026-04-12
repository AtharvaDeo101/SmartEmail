import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

interface EmailCardProps {
  from: string;
  subject: string;
  preview: string;
  date: string;
  onClick?: () => void;
}

export function EmailCard({
  from,
  subject,
  preview,
  date,
  onClick,
}: EmailCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/30 ${onClick ? "hover:scale-[1.02]" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{from}</p>
              <p className="text-xs text-muted-foreground">{date}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-base mb-2 line-clamp-2">{subject}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2">{preview}</p>
      </CardContent>
    </Card>
  );
}
