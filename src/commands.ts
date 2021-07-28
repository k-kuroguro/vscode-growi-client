import { commands, Disposable, Uri, window, workspace } from 'vscode';
import { ApiClient } from './apiClient';
import { Setting } from './setting';

export function registerCommands(setting: Setting, apiClient: ApiClient): Disposable[] {
   return [
      commands.registerCommand('growi-client.setApiToken', () => setApiToken(setting)),
      commands.registerCommand('growi-client.clearApiToken', () => clearApiToken(setting)),
      commands.registerCommand('growi-client.setGrowiUrl', () => setGrowiUrl(setting)),
      commands.registerCommand('growi-client.setUrlAndToken', () => setUrlAndToken(setting)),
      commands.registerCommand('growi-client.openPage', () => openPage(apiClient)),
      commands.registerCommand('growi-client.createNewPage', () => createNewPage(apiClient))
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

async function openPage(apiClient: ApiClient, path?: string): Promise<void> {
   const uri = await (async () => {
      if (!path) {
         path = await window.showInputBox({
            value: '/',
            prompt: '開くページのパスを入力してください.',
            valueSelection: [1, 1],
            validateInput: async (value: string): Promise<string> => {
               if (value === '') return 'パスを入力してください.';
               if (!(await apiClient.pageExists(value))) return `${value} は存在しません.`;
               return '';
            }
         });
         if (!path || path === '') return;
      }
      return Uri.parse('growi:' + path + '.growi');
   })();
   if (!uri) return;
   const doc = await (async () => {
      try {
         return await workspace.openTextDocument(uri);
      } catch (e) {
         window.showErrorMessage(e.message || e);
         return undefined;
      }
   })();
   if (!doc) return;
   await window.showTextDocument(doc, { preview: false });
}

async function createNewPage(apiClient: ApiClient): Promise<void> {
   const input = await window.showInputBox({
      value: '/',
      prompt: '作成するページのパスを入力してください.',
      valueSelection: [1, 1],
      validateInput: async (value: string): Promise<string> => {
         if (value === '') return 'パスを入力してください.';
         if (value.match(/\/{2}/)) return '\'/\'は連続して使用できません.';
         if (value.match(/[#%\$\?\+\^\*]/)) return '使用できない文字が含まれています.';
         if (await apiClient.pageExists(value)) return `${value} は既に存在します.`;
         return '';
      }
   });
   if (!input || input === '') return;
   const normalizePath = (path: string): string => {
      path = path.trim();
      if (!path.startsWith('/')) path = '/' + path;
      if (path.endsWith('/')) path = path.replace(/\/$/, '');
      return path;
   };
   const pagePath = normalizePath(input);
   openPage(apiClient, pagePath);
}
