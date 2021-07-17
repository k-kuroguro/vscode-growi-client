export class BaseError implements Error {

   name = 'BaseError';

   constructor(public message: string) { }

   toString(): string {
      return `${this.name}:${this.message}`;
   }

}
