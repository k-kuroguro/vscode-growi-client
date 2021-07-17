import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { Setting } from './setting';
import { ApiClient } from './apiClient';
import { PageExplorer } from './pageExplorer';

//TODO: ツリー, ページ内容のキャッシュ.
//TODO: trashの中身も表示・編集できる.
//TODO: 今はApi Tokenが必須になっているが, 必要ない処理もあるので要修正.

export async function activate(context: vscode.ExtensionContext) {
   const setting = new Setting(context.globalState);
   const apiClient = new ApiClient(setting);

   context.subscriptions.push(
      setting,
      new PageExplorer(setting, apiClient),
      ...registerCommands(setting)
   );

}

export function deactivate() { }
