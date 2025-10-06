import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GooglePlacesService } from '@/services/GooglePlacesService';
import { Key, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ApiKeyConfig = () => {
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedKey = GooglePlacesService.getApiKey();
    if (savedKey) {
      setIsConfigured(true);
      setApiKey('••••••••••••••••');
    }
  }, []);

  const handleSave = () => {
    if (!apiKey || apiKey.startsWith('••')) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une clé API valide",
        variant: "destructive",
      });
      return;
    }

    GooglePlacesService.saveApiKey(apiKey);
    setIsConfigured(true);
    toast({
      title: "Configuration enregistrée",
      description: "Votre clé API Google Places a été enregistrée avec succès",
    });
    setApiKey('••••••••••••••••');
  };

  const handleReset = () => {
    setIsConfigured(false);
    setApiKey('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Configuration API Google Places
        </CardTitle>
        <CardDescription>
          Entrez votre clé API Google Places pour utiliser l'application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            disabled={isConfigured}
            className="flex-1"
          />
          {isConfigured ? (
            <>
              <Button variant="outline" onClick={handleReset}>
                Modifier
              </Button>
              <div className="flex items-center gap-2 px-3 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Configurée</span>
              </div>
            </>
          ) : (
            <Button onClick={handleSave}>
              Enregistrer
            </Button>
          )}
        </div>
        {!isConfigured && (
          <p className="text-sm text-muted-foreground">
            Obtenez votre clé API sur{' '}
            <a
              href="https://console.cloud.google.com/google/maps-apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google Cloud Console
            </a>
          </p>
        )}
      </CardContent>
    </Card>
  );
};
