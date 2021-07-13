import { commands, Disposable, Uri, window } from 'vscode';
import { Config } from './config';
import { Store } from './store';

export function registerCommands(store: Store): Disposable[] {
   return [
      commands.registerCommand('growi-client.setApiToken', () => setApiToken(store)),
      commands.registerCommand('growi-client.clearApiToken', () => clearApiToken(store)),
      commands.registerCommand('growi-client.setGrowiUrl', () => setGrowiUrl())
   ];
}

async function setApiToken(store: Store): Promise<boolean> {
   const token = await window.showInputBox({
      value: '',
      prompt: 'api tokenを入力してください。',
      validateInput: (value: string) => {
         if (value.includes(' ')) return 'api tokenはスペースを含みません。';
         return '';
      }
   });
   if (!token || token === '') return false;
   store.apiToken = token;
   return true;
}

function clearApiToken(store: Store): void {
   store.apiToken = undefined;
}

async function setGrowiUrl(): Promise<boolean> {
   const url = await window.showInputBox({
      value: Config.growiUrl ?? '',
      prompt: 'GrowiのUrlを入力してください。',
      placeHolder: 'https://demo.growi.org/'
   });
   if (!url || url === '') return false;
   Config.growiUrl = url;
   return true;
}
