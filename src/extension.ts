import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { Store } from './store';
import { ApiClient } from './apiClient';
import { PageExplorer } from './pageExplorer';

//TODO: ツリー,ページ内容のキャッシュ
//TODO: ViewWelcome

export async function activate(context: vscode.ExtensionContext) {
   const store = new Store(context.globalState);
   const apiClient = new ApiClient(store);

   context.subscriptions.push(
      new PageExplorer(apiClient),
      ...registerCommands(store)
   );

}

export function deactivate() { }
