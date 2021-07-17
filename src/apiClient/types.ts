type PageBase = {
   id: string,
   path: string
};

export type PageList = PageBase[];

export type Page = PageBase & {
   revision: {
      _id: string,
      path: string,
      body: string,
      format: string
   }
};
