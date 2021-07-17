import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { Setting } from './setting';
import { ApiClient } from './apiClient';
import { PageExplorer } from './pageExplorer';

//TODO: ツリー, ページ内容のキャッシュ.
//TODO: ViewWelcome
//TODO: trashの中身も表示・編集できる.

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
