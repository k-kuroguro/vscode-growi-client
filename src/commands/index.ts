import { commands, Disposable } from 'vscode';
import { ApiClient } from '../apiClient';
import { extensionName } from '../constants';
import { Setting } from '../setting';
import { newPage } from './newPage';
import { openPage } from './openPage';
import { clearApiToken, setApiToken, setGrowiUrl, setUrlAndToken } from './settings';

export function registerCommands(setting: Setting, apiClient: ApiClient): Disposable[] {
   return [
      commands.registerCommand(`${extensionName}.openPage`, () => openPage(apiClient)),
      commands.registerCommand(`${extensionName}.newPage`, () => newPage(apiClient)),
      commands.registerCommand(`${extensionName}.setApiToken`, () => setApiToken(setting)),
      commands.registerCommand(`${extensionName}.clearApiToken`, () => clearApiToken(setting)),
      commands.registerCommand(`${extensionName}.setGrowiUrl`, () => setGrowiUrl(setting)),
      commands.registerCommand(`${extensionName}.setUrlAndToken`, () => setUrlAndToken(setting))
   ];
}
