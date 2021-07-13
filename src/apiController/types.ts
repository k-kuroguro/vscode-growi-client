export type PageList = {
   pages: [
      {
         id: string,
         path: string
      }
   ]
};

export type Page = {
   page: {
      id: string,
      path: string,
      revision: {
         _id: string,
         path: string,
         body: string,
         format: string
      }
   }
};
