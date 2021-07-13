import { workspace, ConfigurationTarget } from 'vscode';

export class Config {

   static get growiUrl(): string | undefined {
      return workspace.getConfiguration('growi-client').get<string>('growiUrl');
   }

   static set growiUrl(url: string | undefined) {
      if (url) {
         if (!url.endsWith('/')) url = url.trim() + '/';
         url = encodeURI(url);
      }
      workspace.getConfiguration('growi-client').update('growiUrl', url, ConfigurationTarget.Global);
   }

}
