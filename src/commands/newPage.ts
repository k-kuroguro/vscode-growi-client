import * as utils from '../utils';
import { CancellationTokenSource, window } from 'vscode';
import { ApiClient } from '../apiClient';
import { openPage } from './openPage';

export async function newPage(apiClient: ApiClient): Promise<void> {
   const tokenSrc = new CancellationTokenSource();
   const input = await window.showInputBox({
      value: '/',
      prompt: '作成するページのパスを入力してください.',
      valueSelection: [1, 1],
      validateInput: async (value: string): Promise<string> => {
         const [isValid, message] = utils.path.validate(value);
         if (!isValid) return message;
         if (await apiClient
            .pageExists(value)
            .catch(e => {
               window.showErrorMessage('エラー: ' + e.message || e);
               tokenSrc.cancel();
            })) return `${value} は既に存在します.`;
         return '';
      }
   }, tokenSrc.token);
   tokenSrc.dispose();
   if (!input || input === '') return;

   openPage(apiClient, utils.path.normalize(input));
}
