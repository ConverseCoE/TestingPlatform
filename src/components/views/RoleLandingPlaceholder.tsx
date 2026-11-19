import { Clock, Layers, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui';

interface RoleLandingPlaceholderProps {
  title: string;
  phaseLabel: string;
  description: string;
  isRoadmap?: boolean;
}

export function RoleLandingPlaceholder({
  title,
  phaseLabel,
  description,
  isRoadmap = false,
}: RoleLandingPlaceholderProps) {
  const { processes, currentUser } = useAppStore();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant={isRoadmap ? 'violet' : 'default'}>
              {isRoadmap ? 'Planned / Future Phase' : phaseLabel}
            </Badge>
            {currentUser && (
              <span className="text-xs text-slate-500">
                Active Persona: <strong className="text-slate-700">{currentUser.roleLabel}</strong>
              </span>
            )}
          </div>
          <CardTitle className="pt-2 text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-900/5">
            {isRoadmap ? (
              <Clock className="h-5 w-5 text-violet-600 shrink-0" />
            ) : (
              <Sparkles className="h-5 w-5 text-blue-600 shrink-0" />
            )}
            <span>
              {isRoadmap
                ? 'This module is documented in the platform requirements roadmap and will be built after the Process Generator & Runtime phases.'
                : `Workspace shell is active. Dedicated interactive UI for ${title} will be built in ${phaseLabel}.`}
            </span>
          </div>
        </CardContent>
      </Card>

      {!isRoadmap && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {processes.map((proc) => (
            <Card key={proc.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary">{proc.domain}</Badge>
                  <Badge
                    variant={
                      proc.status === 'Published'
                        ? 'success'
                        : proc.status === 'Ready for Testing'
                        ? 'default'
                        : 'warning'
                    }
                  >
                    {proc.status}
                  </Badge>
                </div>
                <CardTitle className="pt-2">{proc.name}</CardTitle>
                <CardDescription className="line-clamp-2">{proc.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-xs text-slate-500">
                <Layers className="h-3.5 w-3.5" />
                <span>v{proc.version} · {proc.tables.length} tables · {proc.skillFile.rules.length} skill rules</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
