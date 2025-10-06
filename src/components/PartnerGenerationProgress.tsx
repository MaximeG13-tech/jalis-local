import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PartnerGenerationProgressProps {
  isGenerating: boolean;
}

const steps = [
  { id: 1, label: "Analyse de votre activité", duration: 3000 },
  { id: 2, label: "Génération des catégories de rapporteurs d'affaires", duration: 5000 },
  { id: 3, label: "Recherche web en temps réel", duration: 8000 },
  { id: 4, label: "Vérification des informations", duration: 6000 },
  { id: 5, label: "Enrichissement des contenus par l'IA", duration: 10000 },
  { id: 6, label: "Finalisation du guide", duration: 2000 },
];

export const PartnerGenerationProgress = ({ isGenerating }: PartnerGenerationProgressProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    let stepIndex = 0;
    let progressInterval: number;
    
    const moveToNextStep = () => {
      if (stepIndex < steps.length) {
        setCurrentStep(stepIndex + 1);
        const step = steps[stepIndex];
        
        // Animate progress for this step
        const startProgress = (stepIndex / steps.length) * 100;
        const endProgress = ((stepIndex + 1) / steps.length) * 100;
        const progressIncrement = (endProgress - startProgress) / (step.duration / 50);
        let currentProgress = startProgress;
        
        progressInterval = window.setInterval(() => {
          currentProgress += progressIncrement;
          if (currentProgress >= endProgress) {
            currentProgress = endProgress;
            clearInterval(progressInterval);
          }
          setProgress(Math.min(currentProgress, 100));
        }, 50);
        
        setTimeout(() => {
          clearInterval(progressInterval);
          stepIndex++;
          if (stepIndex < steps.length) {
            moveToNextStep();
          }
        }, step.duration);
      }
    };

    moveToNextStep();

    return () => {
      clearInterval(progressInterval);
    };
  }, [isGenerating]);

  if (!isGenerating) return null;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-semibold text-lg">Génération en cours...</span>
            </div>
            <span className="text-sm font-medium text-primary">
              {Math.round(progress)}%
            </span>
          </div>
          
          <Progress value={progress} className="h-3" />
          
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              const isPending = currentStep < step.id;
              
              return (
                <div 
                  key={step.id} 
                  className={`flex items-center gap-3 transition-all duration-300 ${
                    isCurrent ? 'scale-105' : ''
                  }`}
                >
                  {isCompleted && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  )}
                  {isCurrent && (
                    <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
                  )}
                  {isPending && (
                    <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className={`text-sm ${
                    isCompleted ? 'text-green-600 line-through' : 
                    isCurrent ? 'text-foreground font-medium' : 
                    'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            L'IA effectue une recherche approfondie et génère du contenu optimisé. Cette opération peut prendre quelques minutes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
