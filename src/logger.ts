import { ExtensionContext, window } from 'vscode';
import { IChildLogger, IVSCodeExtLogger } from '@vscode-logging/types';
import { configureLogger, NOOP_LOGGER } from '@vscode-logging/wrapper';

let loggerImpel: IVSCodeExtLogger = NOOP_LOGGER;

export function getLogger(): IChildLogger {
   return loggerImpel;
}

function setLogger(newLogger: IVSCodeExtLogger): void {
   loggerImpel = newLogger;
}

const LOGGING_LEVEL_PROP = 'growi-client.loggingLevel';
const SOURCE_LOCATION_PROP = 'growi-client.sourceLocationTracking';

export async function initLogger(context: ExtensionContext): Promise<void> {
   const extLogger = configureLogger({
      extName: 'Growi Client',
      logPath: context.logUri.fsPath,
      logOutputChannel: window.createOutputChannel('Growi Client'),
      logConsole: false,
      loggingLevelProp: LOGGING_LEVEL_PROP,
      sourceLocationProp: SOURCE_LOCATION_PROP,
      subscriptions: context.subscriptions
   });

   setLogger(extLogger);
}
