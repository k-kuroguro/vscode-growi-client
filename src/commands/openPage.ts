import { CancellationTokenSource, window, workspace } from 'vscode';
import { ApiClient } from '../apiClient';
import { PathUtil } from '../utils/PathUtil';

export async function openPage(apiClient: ApiClient, path?: string): Promise<void> {
   const uri = await (async () => {
      if (!path) {
         const tokenSrc = new CancellationTokenSource();
         path = await window.showInputBox({
            value: '/',
            prompt: '開くページのパスを入力してください.',
            valueSelection: [1, 1],
            validateInput: async (value: string): Promise<string> => {
               if (value === '') return 'パスを入力してください.';
               if (!(await apiClient
                  .pageExists(value)
                  .catch(e => {
                     window.showErrorMessage('エラー: ' + e.message || e);
                     tokenSrc.cancel();
                  })
               )) return `${value} は存在しません.`;
               return '';
            }
         }, tokenSrc.token);
         tokenSrc.dispose();
         if (!path || path === '') return;
      }
      return PathUtil.toUri(path);
   })();
   if (!uri) return;

   const doc = await (async () => {
      try {
         return await workspace.openTextDocument(uri);
      } catch (e) {
         window.showErrorMessage(e.message || e);
         return;
      }
   })();
   if (!doc) return;

   await window.showTextDocument(doc, { preview: false });
};
