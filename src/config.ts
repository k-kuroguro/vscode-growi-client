import { workspace, ConfigurationTarget } from 'vscode';

export class Config {

   static get growiAddress(): string | undefined {
      return workspace.getConfiguration('growi-client').get<string>('growiAddress');
   }

   static set growiAddress(address: string | undefined) {
      if (address) {
         if (!address.endsWith('/')) address = address.trim() + '/';
         address = encodeURI(address);
      }
      workspace.getConfiguration('growi-client').update('growiAddress', address, ConfigurationTarget.Global);
   }

}
