/*
 This defines the data model of RackHD templates.
*/
export class Template {
    public id: string;
    public name: string;
    public hash: string;
    public scope: string;
}

export const TEMPLATE_URL = {
    getAllUrl: '/templates/metadata',
    getByIdentifierUrl: '/templates/library/',
    getMetadataUrl: '/templates/metadata/',
};
