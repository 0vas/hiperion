import { z } from 'zod';
import { identifier } from './contracts.js';
import { WorkflowError, type Principal, type Run } from './workflow.js';
export const artifactLimit = 10 * 1024 * 1024;
export const artifactName = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .refine(
    (value) =>
      !/[\\/\x00-\x1f\x7f]/.test(value) && !['.', '..'].includes(value),
    'Use a filename, not a path',
  );
export const artifactUrl = z
  .string()
  .url()
  .max(4000)
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        ['https:', 'http:'].includes(url.protocol) &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }, 'Use an HTTP(S) link without credentials');
export const artifactInputSchema = z
  .object({
    stepId: identifier,
    attempt: z.number().int().positive(),
    commandId: z.string().min(1).max(128),
    expectedRevision: z.number().int().nonnegative().optional(),
    name: artifactName,
    mediaType: z
      .string()
      .max(120)
      .regex(/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i)
      .default('application/octet-stream'),
    contentBase64: z
      .string()
      .max(Math.ceil(artifactLimit / 3) * 4)
      .refine((value) => {
        // Avoid repeated regex groups: multi-megabyte uploads can exhaust V8's stack.
        if (value.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(value))
          return false;
        const padding = value.indexOf('=');
        return (
          padding === -1 ||
          (padding >= value.length - 2 && /^={1,2}$/.test(value.slice(padding)))
        );
      }, 'Invalid base64 content')
      .optional(),
    url: artifactUrl.optional(),
  })
  .strict()
  .refine(
    (value) =>
      (value.contentBase64 !== undefined) !== (value.url !== undefined),
    'Provide exactly one file content or URL',
  );
export type ArtifactInput = z.input<typeof artifactInputSchema>;
export type Artifact = {
  id: string;
  name: string;
  mediaType: string;
  createdAt: string;
  attempt: number;
  size?: number;
  sha256?: string;
  url?: string;
};
export function attachArtifact(
  current: Run,
  artifact: Artifact,
  command: Pick<ArtifactInput, 'stepId' | 'attempt' | 'expectedRevision'>,
  actor: Principal,
): Run {
  if (actor.role !== 'agent' || actor.id !== current.coordinator)
    throw new WorkflowError(
      'FORBIDDEN',
      'Only the coordinator can register artifacts',
      403,
    );
  if (
    command.expectedRevision !== undefined &&
    command.expectedRevision !== current.revision
  )
    throw new WorkflowError('REVISION_CONFLICT', 'Revision changed');
  if (!['active', 'paused', 'completed'].includes(current.status))
    throw new WorkflowError('TERMINAL', 'Run was cancelled or rejected');
  const run = structuredClone(current);
  const step = run.steps.find((s) => s.id === command.stepId);
  if (!step) throw new WorkflowError('NOT_FOUND', 'Step not found', 404);
  if (step.kind !== 'agent' || !['running', 'completed'].includes(step.status))
    throw new WorkflowError(
      'NOT_RUNNING',
      'Artifacts belong to running or completed agent steps',
    );
  if (command.attempt !== step.attempt || artifact.attempt !== step.attempt)
    throw new WorkflowError(
      'STALE_ATTEMPT',
      'Artifact belongs to another attempt',
    );
  if ((step.artifacts?.length || 0) >= 100)
    throw new WorkflowError(
      'ARTIFACT_LIMIT',
      'A step supports up to 100 artifacts',
      400,
    );
  step.artifacts = [...(step.artifacts || []), artifact];
  run.revision++;
  run.updatedAt = artifact.createdAt;
  run.events.push({
    sequence: (run.events.at(-1)?.sequence || 0) + 1,
    type: 'artifact',
    actor: actor.id,
    at: artifact.createdAt,
    stepId: step.id,
    message: `Artefacto registrado: ${artifact.name}`,
  });
  return run;
}
