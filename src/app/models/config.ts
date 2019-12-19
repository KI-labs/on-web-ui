/*
 This defines the data model of RackHD configures.
*/
export class Config {
  public key: string;
  public value: string;
}

export const CONFIG_URL = {
    getAllUrl: '/config',
    patchUrl: '/config',
};
