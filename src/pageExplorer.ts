import * as vscode from 'vscode';
import * as path from 'path';
import { ApiClient, ApiClientError } from './apiClient';
import { Setting, SettingsError, Util as ConfigUtil } from './setting';

type TreeItem = Page | Button;
type TreeItemMap = Map<string /* path */, TreeItem>;
type ButtonType = 'CreatePage' | 'LoadNextPages';

class Util {

   static handleError(e: any): void {
      if (e instanceof ApiClientError) {
         vscode.window.showErrorMessage(e.message);
         return;
      } else if (e instanceof SettingsError) {
         if (e.code === SettingsError.UndefinedSettings().code) return; //viewsWelcomeでエラー表示するため, 何もしない
         else throw e;
      }
      throw e;
   }

   static async showProgress(promise: Promise<any>): Promise<void> {
      vscode.window.withProgress({
         location: { viewId: 'growi-client.pageExplorer' },
         cancellable: false
      }, () => promise);
   }

}

class Button extends vscode.TreeItem {

   constructor(public type: ButtonType, public parentPath: string, options?: { animated?: boolean }) {
      super(Button.getTitle(type), vscode.TreeItemCollapsibleState.None);

      this.command = Button.getCommand(type, parentPath);
      this.iconPath = Button.getIconPath(type, options?.animated);
      this.contextValue = 'Button';
   }

   static getTitle(type: ButtonType): string {
      switch (type) {
         case 'CreatePage':
            return 'ページ作成';
         case 'LoadNextPages':
            return '続きを読み込む';
      }
   }

   static getIconPath(type: ButtonType, animated?: boolean): vscode.ThemeIcon {
      switch (type) {
         case 'CreatePage':
            return new vscode.ThemeIcon('edit');
         case 'LoadNextPages':
            return new vscode.ThemeIcon(`sync${animated ? '~spin' : ''}`);
      }
   }

   static getCommand(type: ButtonType, parentPath: string): vscode.Command {
      switch (type) {
         case 'CreatePage':
            return { arguments: [parentPath], command: 'growi-client.pageExplorer.createNewChildPage', title: 'New Page' };
         case 'LoadNextPages':
            return { arguments: [parentPath], command: 'growi-client.pageExplorer.loadNextPages', title: 'Load Next Pages' };
      }
   }

}

class Page extends vscode.TreeItem {

   nextOffset: number = 0;
   loading: boolean = false; //今, 子ページを読み込んでいるか
   done: boolean = false;    //全ての子ページを読み込んだか
   readonly children: TreeItemMap = new Map();

   constructor(public title: string, public fullPath: string) {
      super(title, vscode.TreeItemCollapsibleState.Collapsed);

      this.command = { arguments: [fullPath], command: 'growi-client.pageExplorer.openPage', title: 'Open Page' };
      this.iconPath = new vscode.ThemeIcon('notebook');
      this.tooltip = fullPath;
      this.contextValue = 'Page';
   }

}

class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {

   private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | void> = new vscode.EventEmitter<TreeItem | undefined | void>();
   readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;

   private readonly limit = 50;
   private readonly itemMap: TreeItemMap = new Map();

   constructor(private readonly setting: Setting, private readonly apiClient: ApiClient) { }

   refresh(path?: string, options?: { hard?: boolean }): void {
      if (!path) {
         this._onDidChangeTreeData.fire();
         return;
      }
      const page = this.itemMap.get(path);
      if (!(page instanceof Page)) return;
      if (options?.hard) {
         page.nextOffset = 0;
         page.done = false;
         page.children.clear();
         this.itemMap.set(path, page);
      }
      this._onDidChangeTreeData.fire(page);
   }

   async loadNextPages(path: string): Promise<void> {
      Util.showProgress(this.loadChildren(path));
   }

   //TODO: 空のページを開いたときの動作(今は開かない)

   getTreeItem(element: TreeItem): TreeItem {
      return element;
   }

   async getChildren(element?: TreeItem): Promise<TreeItem[]> {
      if (!element) {
         const rootPath = this.setting.rootPath;
         if (!(await this.apiClient.getPage(rootPath).catch(e => {
            if (e.code === ApiClientError.PageIsNotFound().code) return true; //存在しなくてもOK
            Util.handleError(e);
         }))) return [];
         const root = new Page(rootPath === '/' ? 'root' : path.posix.basename(rootPath), rootPath);
         this.itemMap.clear();
         this.itemMap.set(rootPath, root);
         return [root];
      }

      if (!(element instanceof Page)) return [];

      const page = this.itemMap.get(element.fullPath);
      if (!(page instanceof Page)) return [];

      if (!page.loading && !page.done) Util.showProgress(this.loadChildren(page.fullPath));

      return [...page.children.values()];
   }

   private async loadChildren(parentPath: string, options?: { lastPageCount?: number }): Promise<void> {
      const parentPage = this.itemMap.get(parentPath);
      if (!(parentPage instanceof Page)) return;

      //loading状態を表示
      parentPage.loading = true;
      if (parentPage.children.has('LoadButton')) parentPage.children.set('LoadButton', new Button('LoadNextPages', parentPath, { animated: true }));
      this.itemMap.set(parentPath, parentPage);
      this.refresh(parentPath);

      const response = await this.apiClient
         .getPages(path.posix.join(parentPage.fullPath, '/'), { limit: this.limit, offset: parentPage.nextOffset })
         .catch(e => Util.handleError(e));
      if (!response) {
         parentPage.loading = false;
         parentPage.done = true;
         this.itemMap.set(parentPath, parentPage);
         return;
      }

      //子ページがないとき
      if (!response.totalCount) {
         parentPage.nextOffset = 0;
         parentPage.loading = false;
         parentPage.done = true;
         parentPage.children.clear();
         parentPage.children.set('CreateButton', new Button('CreatePage', parentPath));
         this.itemMap.set(parentPath, parentPage);
         this.refresh(parentPath);
         return;
      }

      let i, pageCount = options?.lastPageCount ?? 0;
      const maxPagePerTime = this.setting.maxPagePerTime;
      const exceedMaxPagePerTime = (pageCount: number) => pageCount >= maxPagePerTime;
      const children: TreeItemMap = new Map(parentPage.children.entries());
      for (i = 0; i < response.pages.length; i++) {
         const responsePage = response.pages[i];
         if (responsePage.path === parentPath) continue;

         const title = (
            responsePage.path
               .replace(new RegExp(`^${path.posix.join(parentPath, '/')}`), '')
               .match(/^[^\/]*/)
            || [undefined]
         )[0];
         if (!title || children.has(title)) continue;
         const fullPath = path.posix.join(parentPath, title);
         const child = new Page(title, fullPath);
         children.set(title, child);
         this.itemMap.set(fullPath, child);
         if (exceedMaxPagePerTime(++pageCount)) break;
      }

      const hasNextPages = response.pages.length === this.limit;
      parentPage.nextOffset = i + parentPage.nextOffset;
      for (const [title, child] of children.entries()) {
         parentPage.children.set(title, child);
      }
      parentPage.children.delete('LoadButton');

      if (!exceedMaxPagePerTime(pageCount) && hasNextPages) {
         parentPage.loading = true;
         parentPage.done = false;
         this.itemMap.set(parentPath, parentPage);
         Util.showProgress(this.loadChildren(parentPath, { lastPageCount: pageCount }));
         if (children.size !== 0 /* hasChanged */) this.refresh(parentPath);
         return;
      }

      parentPage.loading = false;
      parentPage.done = true;
      if (hasNextPages) parentPage.children.set('LoadButton', new Button('LoadNextPages', parentPath));
      this.itemMap.set(parentPath, parentPage);
      this.refresh(parentPath);
   }

}

export class PageExplorer {

   private readonly treeView: vscode.TreeView<TreeItem>;
   private readonly treeDataProvider: TreeDataProvider;
   private readonly disposables: vscode.Disposable[] = [];

   constructor(private readonly setting: Setting, private readonly apiClient: ApiClient) {
      this.treeDataProvider = new TreeDataProvider(setting, apiClient);
      this.treeView = vscode.window.createTreeView('growi-client.pageExplorer', { treeDataProvider: this.treeDataProvider, canSelectMany: false, showCollapseAll: true });

      this.disposables.push(
         this.treeView,
         this.setting.onDidChange(() => {
            //TODO: 部分更新
            this.treeDataProvider.refresh();
         }),
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
         vscode.commands.registerCommand('growi-client.pageExplorer.loadNextPages', (path?: string) => path && this.loadNextPages(path)),
         vscode.commands.registerCommand('growi-client.pageExplorer.createNewChildPage', (path?: string) => path && this.createNewPage(path)),
         vscode.commands.registerCommand('growi-client.pageExplorer.openPageInBrowser', (item?: TreeItem) => item instanceof Page && this.openPageInBrowser(item)),
         vscode.commands.registerCommand('growi-client.pageExplorer.editPageInBrowser', (item?: TreeItem) => item instanceof Page && this.editPageInBrowser(item)),
         vscode.commands.registerCommand('growi-client.pageExplorer.createNewPage', (item?: TreeItem) => item instanceof Page && this.createNewPage(item.fullPath)),
         vscode.commands.registerCommand('growi-client.pageExplorer.refreshChildren', (item?: TreeItem) => item instanceof Page && this.refresh(item.fullPath))
      ];
   }

   private refresh(path?: string): void {
      this.treeDataProvider.refresh(path, { hard: true });
   }

   private async openPage(path: string): Promise<void> {
      const uri = vscode.Uri.parse('growi:' + path + '.growi');
      const doc = await (async () => {
         try {
            return await vscode.workspace.openTextDocument(uri);
         } catch (e) {
            vscode.window.showErrorMessage(e.message || e);
            return undefined;
         }
      })();
      if (!doc) return;
      await vscode.window.showTextDocument(doc, { preview: false });
   }

   private loadNextPages(path: string): void {
      this.treeDataProvider.loadNextPages(path);
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
      const initialPath = path.posix.join(parentPath ?? this.setting.rootPath, '/');
      const input = await vscode.window.showInputBox({
         value: initialPath,
         prompt: '作成するページのパスを入力してください.',
         valueSelection: [initialPath.length, initialPath.length],
         validateInput: async (value: string): Promise<string> => {
            if (value === '') return 'パスを入力してください.';
            if (value.match(/\/{2}/)) return '\'/\'は連続して使用できません.';
            if (value.match(/[#%\$\?\+\^\*]/)) return '使用できない文字が含まれています.';
            if (await this.apiClient.pageExists(value)) return `${value} は既に存在します.`;
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
      if (await this.apiClient.createPage(pagePath, `# ${path.basename(pagePath)}`).catch(e => Util.handleError(e))) {
         this.openPage(pagePath);
         this.refresh(parentPath);
      }
   }

   //#endregion

}

