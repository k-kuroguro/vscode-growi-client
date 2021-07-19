import * as vscode from 'vscode';
import * as path from 'path';
import { ApiClient, ApiClientError } from './apiClient';
import { Setting, SettingsError, Util as ConfigUtil } from './setting';
import { FsProvider } from './fsProvider';

class Util {

   static handleError(e: any): void {
      if (e instanceof ApiClientError) {
         vscode.window.showErrorMessage(e.message);
         return;
      } else if (e instanceof SettingsError) {
         if (e.code === SettingsError.UndefinedSettings().code) return;
         else throw e;
      }
      throw e;
   }

}

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
      if (!element) return [new Page('root', true, false, '/')];

      const response = await this.apiClient
         .getPages(path.posix.join(element.fullPath, '/'))
         .catch(e => Util.handleError(e));
      if (!response) return [];

      const pageMap: Map<string, { fullPath: string, hasChildren: boolean, isBlank: boolean }> = new Map();

      for (const responsePage of response.pages) {
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

   constructor(private readonly setting: Setting, private readonly apiClient: ApiClient) {
      this.fsProvider = new FsProvider(apiClient);
      this.treeDataProvider = new TreeDataProvider(apiClient);
      this.treeView = vscode.window.createTreeView('growi-client.pageExplorer', { treeDataProvider: this.treeDataProvider, canSelectMany: false, showCollapseAll: true });

      this.disposables.push(
         this.treeView,
         this.setting.onDidChange(() => this.treeDataProvider.refresh()),
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
         vscode.commands.registerCommand('growi-client.pageExplorer.openPage', (path?: string) => path && this.openPage(path)),
         vscode.commands.registerCommand('growi-client.pageExplorer.openPageInBrowser', (page?: Page) => page && this.openPageInBrowser(page)),
         vscode.commands.registerCommand('growi-client.pageExplorer.editPageInBrowser', (page?: Page) => page && this.editPageInBrowser(page)),
         vscode.commands.registerCommand('growi-client.pageExplorer.createNewPage', (page?: Page) => this.createNewPage(page ? path.posix.join(page.fullPath, '/') : undefined))
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

   private openPageInBrowser(page: Page): void {
      const growiUrl = this.setting.growiUrl;
      if (!growiUrl) {
         ConfigUtil.showErrorAboutSettings(false, true);
         return;
      }
      vscode.env.openExternal(vscode.Uri.parse(path.posix.join(growiUrl, page.fullPath)));
   }

   private editPageInBrowser(page: Page): void {
      const growiUrl = this.setting.growiUrl;
      if (!growiUrl) {
         ConfigUtil.showErrorAboutSettings(false, true);
         return;
      }
      vscode.env.openExternal(vscode.Uri.parse(path.posix.join(growiUrl, page.fullPath) + '#edit'));
   }

   private async createNewPage(parentPath?: string): Promise<void> {
      const input = await vscode.window.showInputBox({
         value: parentPath ?? '/',
         prompt: '作成するページのパスを入力してください。',
         validateInput: (value: string): string => {
            if (value === '') return 'パスを入力してください.';
            if (value.match(/\/{2}/)) return '\'/\'は連続して使用できません.';
            if (value.match(/[#%\$\?\+\^\*]/)) return '使用できない文字が含まれています.';
            return '';
         }
      });
      if (!input || input === '') return;
      const normalizePath = (path: string): string => {
         path = path.trim();
         if (!path.startsWith('/')) path = '/' + path;
         if (path.endsWith('/')) path = path.replace(/\/$/, '');
         //TODO: ページの存在確認
         return path;
      };
      const pagePath = normalizePath(input);
      await this.apiClient.createPage(pagePath, `# ${path.basename(pagePath)}`).catch(e => Util.handleError(e));
      this.refresh();
   }

   //#endregion

}

