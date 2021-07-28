import * as pathLib from 'path';
import { Uri } from 'vscode';

export class PathUtil {

   static readonly scheme = 'growi';
   static readonly ext = 'growi';
   static readonly root = '/';

   static validate(path: string): [boolean, string] {
      if (path === '') return [false, 'パスを入力してください.'];
      if (path.match(/\/{2}/)) return [false, '\'/\'は連続して使用できません.'];
      if (path.match(/[#%\$\?\+\^\*]/)) return [false, '使用できない文字が含まれています.'];
      return [true, ''];
   }

   static toUri(path: string): Uri {
      return Uri.parse(`${PathUtil.scheme}:${path}.${PathUtil.ext}`);
   }

   static Uri(uri: Uri): string {
      if (uri.scheme !== PathUtil.scheme) return this.root;
      if (pathLib.posix.extname(uri.path) !== PathUtil.ext) return this.root;
      return PathUtil.normalize(uri.path.replace(/.growi$/, ''));
   }

   static normalize(path: string): string {
      path = path.trim();
      if (!path.startsWith('/')) path = '/' + path;
      if (path.endsWith('/')) path = path.replace(/\/$/, '');
      path = pathLib.posix.normalize(path);
      return path;
   }

}
