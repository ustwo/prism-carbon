import { LogProvider } from '../logProvider';
import { copilotLogProvider } from './copilotLogProvider';

export const ALL_LOG_PROVIDERS: LogProvider[] = [
    copilotLogProvider,
];
