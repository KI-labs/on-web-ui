/*
 This defines the data model of RackHD profiles.
*/
export class File {
    public uuid: string;
    public version: string;
    public sha256: string;
    public md5: string;
    public filename: string;
    public basename: string;
}

export const FILE_URL = {
    getAllUrl: '/files',
    getByIdentifierUrl: '/files/',
    getMetadataUrl: '/files/'
};
