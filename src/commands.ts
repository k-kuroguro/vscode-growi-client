import { commands, Disposable, window } from 'vscode';
import { Setting } from './setting';

export function registerCommands(setting: Setting): Disposable[] {
   return [
      commands.registerCommand('growi-client.setApiToken', () => setApiToken(setting)),
      commands.registerCommand('growi-client.clearApiToken', () => clearApiToken(setting)),
      commands.registerCommand('growi-client.setGrowiUrl', () => setGrowiUrl(setting)),
      commands.registerCommand('growi-client.setUrlAndToken', () => setUrlAndToken(setting))
   ];
}

async function setApiToken(setting: Setting): Promise<boolean> {
   const token = await window.showInputBox({
      value: '',
      prompt: 'Api Tokenを入力してください.',
      validateInput: (value: string) => {
         if (value.includes(' ')) return 'Api Tokenはスペースを含みません.';
         return '';
      }
   });
   if (!token || token === '') return false;
   setting.apiToken = token;
   return true;
}

function clearApiToken(setting: Setting): void {
   setting.apiToken = undefined;
}

async function setGrowiUrl(setting: Setting): Promise<boolean> {
   const url = await window.showInputBox({
      value: setting.growiUrl ?? '',
      prompt: 'GrowiのURLを入力してください.',
      placeHolder: 'https://demo.growi.org/'
   });
   if (!url || url === '') return false;
   setting.growiUrl = url;
   return true;
}

async function setUrlAndToken(setting: Setting): Promise<void> {
   //TODO: use multi step input
   await setGrowiUrl(setting);
   await setApiToken(setting);
}
