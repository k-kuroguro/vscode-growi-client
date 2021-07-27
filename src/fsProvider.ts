import { TextEncoder } from 'util';
import { Disposable, Event, EventEmitter, FileChangeEvent, FileChangeType, FileStat as VsFileStat, FileSystemProvider, FileType, Uri, window } from 'vscode';
import { ApiClient, ApiClientError } from './apiClient';
import { SettingsError } from './setting';

//TODO: writeFile/delete/rename時にonDidChange発火
export class FsProvider implements FileSystemProvider {

   private _onDidChangeFile: EventEmitter<FileChangeEvent[]> = new EventEmitter();
   readonly onDidChangeFile: Event<FileChangeEvent[]> = this._onDidChangeFile.event;

   constructor(private readonly apiClient: ApiClient) { }

   //TODO: サーバー側の変更を検知する.
   watch(uri: Uri, options: { recursive: boolean; excludes: string[]; }): Disposable {
      return { dispose: () => { } };
   }

   //TODO: pages.getで得られるデータを返すようにする.
   stat(uri: Uri): FileStat | Thenable<FileStat> {
      return new FileStat();
   }

   readDirectory(uri: Uri): [string, FileType][] | Thenable<[string, FileType][]> {
      console.log('FsProvider.readDirectory not implemented.');
      throw new Error('FsProvider.readDirectory not implemented.');
   }

   createDirectory(uri: Uri): void | Thenable<void> {
      console.log('FsProvider.createDirectory not implemented.');
      throw new Error('FsProvider.createDirectory not implemented.');
   }

   //TODO: 新規作成時にメッセージ
   async readFile(uri: Uri): Promise<Uint8Array> {
      const response = await this.apiClient
         .getPage(this.removeExt(uri.path))
         .catch(e => {
            if (e.code === ApiClientError.PageIsNotFound().code) return;
            this.handleError(e);
         });
      if (!response) return this.toUint8Array(''); //存在しない場合空文字列を返す
      return this.toUint8Array(response.revision.body);
   }

   //エラーメッセージ表示の仕様上, 文字列をthrowする.
   async writeFile(uri: Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): Promise<void> {
      const pagePath = this.removeExt(uri.path);
      if (await this.apiClient.pageExists(pagePath)) {
         if (!options.overwrite) throw ApiClientError.PageExists(pagePath).message;
         if (content.toString() === '') throw ApiClientError.ContentIsEmpty().message;
         await this.apiClient
            .updatePage(pagePath, content.toString())
            .catch(e => this.handleError(e));
         this._onDidChangeFile.fire([{ type: FileChangeType.Changed, uri }]);
      } else {
         if (!options.create) throw ApiClientError.PageIsNotFound(pagePath).message;
         if (content.toString() === '') throw ApiClientError.ContentIsEmpty().message;
         await this.apiClient
            .createPage(pagePath, content.toString())
            .catch(e => this.handleError(e));
         this._onDidChangeFile.fire([{ type: FileChangeType.Created, uri }]);
      }
   }

   delete(uri: Uri, options: { recursive: boolean; }): void | Thenable<void> {
      console.log('FsProvider.delete not implemented.');
      throw new Error('FsProvider.delete not implemented.');
   }

   rename(oldUri: Uri, newUri: Uri, options: { overwrite: boolean; }): void | Thenable<void> {
      console.log('FsProvider.rename not implemented.');
      throw new Error('FsProvider.rename not implemented.');
   }

   private toUint8Array(string: string): Uint8Array {
      return (new TextEncoder).encode(string);
   }

   private removeExt(path: string): string {
      return path.replace(/.growi$/g, '');
   }

   //TODO: イベント発火させる
   private handleError(e: any): never {
      if (e instanceof ApiClientError) {
         throw e.message;
      } else if (e instanceof SettingsError) {
         throw e.message;
      }
      throw e;
   }

}

//TODO: pages.getで得られるデータを表せるようにする.
class FileStat implements VsFileStat {

   constructor() { }

   get type(): FileType {
      return FileType.File;
   }

   get isFile(): boolean | undefined {
      return true;
   }

   get isDirectory(): boolean | undefined {
      return false;
   }

   get isSymbolicLink(): boolean | undefined {
      return false;
   }

   get size(): number {
      return NaN;
   }

   get ctime(): number {
      return NaN;
   }

   get mtime(): number {
      return NaN;
   }

}
