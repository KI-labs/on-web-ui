/*
 This defines the data model of RackHD profiles.
*/
export class Profile {
    public id: string;
    public name: string;
    public hash: string;
    public scope: string;
}

export const PROFILE_URL = {
    getAllUrl: '/profiles/metadata',
    getByIdentifierUrl: '/profiles/library/',
    getMetadataUrl: '/profiles/metadata/'
};
