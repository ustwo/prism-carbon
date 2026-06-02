import { LogProvider } from '../logProvider';
import { copilotLogProvider } from './copilotLogProvider';
import { claudeCodeLogProvider } from './claudeCodeLogProvider';

export const ALL_LOG_PROVIDERS: LogProvider[] = [
    copilotLogProvider,
    claudeCodeLogProvider,
];
