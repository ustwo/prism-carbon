import { CaptureProvider } from '../../../captureProvider';
import { anthropicProvider } from './anthropicProvider';
import { openaiProvider } from './openaiProvider';
import { geminiProvider } from './geminiProvider';

export const ALL_PROVIDERS: CaptureProvider[] = [
    anthropicProvider,
    openaiProvider,
    geminiProvider,
];
