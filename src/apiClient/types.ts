export type PageBase = {
   id: string,
   path: string
};

export type PageList = {
   pages: PageBase[],
   totalCount: number,
   limit: number,
   offset: number
};

export type Page = PageBase & {
   revision: {
      _id: string,
      path: string,
      body: string,
      format: string
   }
};

export type Sort = 'path' | 'createdAt' | 'updatedAt';
