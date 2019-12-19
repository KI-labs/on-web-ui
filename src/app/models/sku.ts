/*
 This defines the data model of Node's SKU.
*/
export class SKU {
    public id: string;
    public name: string;
    public discoveryGraphName: string;
    public discoveryGraphOptions: {};
    public rules: any;
    public skuConfig: any;
}

export const SKU_URL = {
    getAllUrl: '/skus',
    getByIdentifierUrl: '/skus/',
    uploadUrl: '/skus/pack',
    uploadSuffix: '/pack',
};
