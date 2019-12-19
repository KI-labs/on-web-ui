/*
 This defines the data model of Node's catalog.
*/
export class Catalog {
    public id: string;
    public node: string;
    public source: string;
    public data: any; // {} or []
}

export const CATALOG_URL = {
    getAllUrl: '/catalogs',
    getByIdentifierUrl: '/catalogs/',
};
