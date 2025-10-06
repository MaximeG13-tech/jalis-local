import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface ProgressIndicatorProps {
  current: number;
  total: number;
}

export const ProgressIndicator = ({ current, total }: ProgressIndicatorProps) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-medium">Recherche en cours...</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {current} / {total}
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
          <p className="text-sm text-muted-foreground">
            Analyse des entreprises et récupération des informations de contact
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
