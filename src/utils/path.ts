import * as pathLib from 'path';
import { Uri } from 'vscode';

const scheme = 'growi';
const ext = 'growi';
const root = '/';

function join(...paths: string[]): string {
   return pathLib.posix.join(...paths);
}

function validate(path: string): [boolean, string] {
   if (path === '') return [false, 'パスを入力してください.'];
   if (path.match(/\/{2}/)) return [false, '\'/\'は連続して使用できません.'];
   if (path.match(/[#%\$\?\+\^\*]/)) return [false, '使用できない文字が含まれています.'];
   return [true, ''];
}

function toUri(path: string): Uri {
   return Uri.parse(`${scheme}:${path}.${ext}`);
}

function toPath(uri: Uri): string {
   if (uri.scheme !== scheme) return root;
   if (pathLib.posix.extname(uri.path) !== ext) return root;
   return normalize(uri.path.replace(/.growi$/, ''));
}

function normalize(path: string): string {
   path = path.trim();
   if (!path.startsWith('/')) path = '/' + path;
   if (path !== '/' && path.endsWith('/')) path = path.replace(/\/$/, '');
   if (path !== '/') path = pathLib.posix.normalize(path);
   return path;
}

export { scheme, ext, root, join, validate, toUri, toPath, normalize };
