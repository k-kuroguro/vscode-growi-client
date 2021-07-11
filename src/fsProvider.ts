import { TextEncoder } from 'util';
import { Disposable, Event, EventEmitter, FileChangeEvent, FileStat as VsFileStat, FileSystemProvider, FileType, Uri } from 'vscode';
import { ApiController } from './apiController';

export class FsProvider implements FileSystemProvider {

   private _onDidChangeFile: EventEmitter<FileChangeEvent[]> = new EventEmitter();
   readonly onDidChangeFile: Event<FileChangeEvent[]> = this._onDidChangeFile.event;

   constructor(private readonly apiController: ApiController) { }

   //TODO: サーバー側の変更を検知する
   watch(uri: Uri, options: { recursive: boolean; excludes: string[]; }): Disposable {
      return { dispose: () => { } };
   }

   //TODO: pages.getで得られるデータを返すようにする
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

   async readFile(uri: Uri): Promise<Uint8Array> {
      const response = await this.apiController.getPage(this.removeExt(uri.path));
      if (!response) throw new Error('Failed to get page.');
      return this.toUint8Array(response.page.revision.body);
   }

   async writeFile(uri: Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): Promise<void> {
      const response = await this.apiController.updatePage(this.removeExt(uri.path), content.toString());
      if (!response) throw new Error('Failed to update page.');
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

}

//TODO: pages.getで得られるデータを表せるようにする
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
