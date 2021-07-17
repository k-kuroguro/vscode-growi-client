import { workspace, ConfigurationTarget } from 'vscode';

export class Config {

   /**
    * エンコード, 先頭/末尾のスペース除去済みのURL
    *
    * @example
    * 末尾に'/'の付いたURL
    *  - 'https://demo.growi.org/'
    *  - 'http://127.0.0.1/'
    */
   static get growiUrl(): string | undefined {
      return workspace.getConfiguration('growi-client').get<string>('growiUrl');
   }

   static set growiUrl(url: string | undefined) {
      if (url) {
         url = url.trim();
         if (!url.endsWith('/')) url = url + '/';
         url = encodeURI(url);
      }
      workspace.getConfiguration('growi-client').update('growiUrl', url, ConfigurationTarget.Global);
   }

}
