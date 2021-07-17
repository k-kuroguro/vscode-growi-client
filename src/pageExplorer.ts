import * as vscode from 'vscode';
import { ApiClient, ApiClientError } from './apiClient';
import { SettingsError } from './error';
import { FsProvider } from './fsProvider';
import { Util as ConfigUtil } from './config';

class Page extends vscode.TreeItem {

   constructor(public title: string, public hasChildren: boolean, public isBlank: boolean, public fullPath: string) {
      super(title, hasChildren ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);

      this.command = isBlank ? undefined : { arguments: [fullPath], command: 'growi-client.pageExplorer.openPage', title: 'Open Page' };
      this.iconPath = isBlank ? new vscode.ThemeIcon('file') : new vscode.ThemeIcon('notebook');
      this.tooltip = fullPath;
   }

}

class TreeDataProvider implements vscode.TreeDataProvider<Page> {

   private _onDidChangeTreeData: vscode.EventEmitter<Page | undefined | void> = new vscode.EventEmitter<Page | undefined | void>();
   readonly onDidChangeTreeData: vscode.Event<Page | undefined | void> = this._onDidChangeTreeData.event;

   constructor(private readonly apiClient: ApiClient) { }

   refresh(): void {
      this._onDidChangeTreeData.fire();
   }

   getTreeItem(element: Page): Page {
      return element;
   }

   async getChildren(element?: Page): Promise<Page[]> {
      const response = await this.apiClient.getPages(element && element.fullPath !== '/' ? element.fullPath + '/' : undefined)
         .catch(e => {
            if (e instanceof ApiClientError) {
               vscode.window.showErrorMessage(e.message);
               return undefined;
            } else if (e instanceof SettingsError) {
               if (e.code === SettingsError.UndefinedSettings().code) {
                  ConfigUtil.showErrorAboutSettings(!e.hasError('Growi URL'), !e.hasError('Api Token'));
                  return undefined;
               }
               else throw e;
            }
            throw e;
         });

      if (!response) return [];

      if (!element) {
         const title = 'root', fullPath = '/';
         let isBlank: boolean = true, hasChildren: boolean = false;
         for (const responsePage of response) {
            if (responsePage.path.match(/^\/.*?\/.*/g)) hasChildren = true;
            if (responsePage.path === '/') isBlank = false;
            if (!isBlank && hasChildren) break;
         }
         return [new Page(title, hasChildren, isBlank, fullPath)];
      }

      const pageMap: Map<string, { fullPath: string, hasChildren: boolean, isBlank: boolean }> = new Map();

      for (const responsePage of response) {
         if (responsePage.path === '/') continue;

         const path = (element.fullPath !== '/' ? responsePage.path.replace(element.fullPath, '') : responsePage.path).replace(/^\//, '');
         const parentPath = path.match(/^.*?(?=\/)/g);
         const hasChildren = !!path.match(/(?<=^.*?)\/.*/g);
         const title = parentPath && parentPath.length ? parentPath[0] : path;
         const page = pageMap.get(title);
         if (page) {
            pageMap.set(title, {
               fullPath: page.fullPath,
               hasChildren: hasChildren ? true : page.hasChildren,
               isBlank: title === path ? false : page.isBlank
            });
         } else {
            pageMap.set(title, {
               fullPath: (element.fullPath !== '/' ? element.fullPath + '/' : '/') + title,
               hasChildren,
               isBlank: title !== path
            });
         }
      }
      return [...pageMap.keys()]
         .sort((a, b) => a.localeCompare(b))
         .map(key => {
            const page = pageMap.get(key);
            return page ? new Page(key, page.hasChildren, page.isBlank, page.fullPath) : new Page(key, false, true, '');
         });
   }

}

export class PageExplorer {

   private readonly treeView: vscode.TreeView<Page>;
   private readonly treeDataProvider: TreeDataProvider;
   private readonly fsProvider: FsProvider;
   private readonly disposables: vscode.Disposable[] = [];
   private readonly scheme = 'growi';

   constructor(apiClient: ApiClient) {
      this.fsProvider = new FsProvider(apiClient);
      this.treeDataProvider = new TreeDataProvider(apiClient);
      this.treeView = vscode.window.createTreeView('growi-client.pageExplorer', { treeDataProvider: this.treeDataProvider, canSelectMany: false, showCollapseAll: true });

      this.disposables.push(
         this.treeView,
         vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('growi-client.growiUrl')) {
               this.treeDataProvider.refresh();
            }
         }),
         vscode.workspace.registerFileSystemProvider(this.scheme, this.fsProvider, { isCaseSensitive: true }),
         ...this.registerCommands()
      );
   }

   dispose(): void {
      this.disposables.forEach(d => d.dispose());
   }

   //#region commands

   registerCommands(): vscode.Disposable[] {
      return [
         vscode.commands.registerCommand('growi-client.pageExplorer.refresh', () => this.refresh()),
         vscode.commands.registerCommand('growi-client.pageExplorer.openPage', (path?: string) => path && this.openPage(path))
      ];
   }

   private refresh(): void {
      this.treeDataProvider.refresh();
   }

   private async openPage(path: string): Promise<void> {
      const uri = vscode.Uri.parse('growi:' + path + '.growi');
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc, { preview: false });
   }

   //#endregion

}

