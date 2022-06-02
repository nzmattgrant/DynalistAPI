export interface SendToInboxParameters {
    token?: string,
    content?: string,
    index?: number,
    note?: string, 
    checked?: string, 
    checkbox?: string, 
    heading?: string,
    color?: string
}

export interface DynalistNode {
    id: string;
    content: string;
    note: string;
    created: number, // timestamp in milliseconds of the creation time
    modified: number, // timestamp in milliseconds of the last modified time
    children: string[]
}

export interface DynalistDocument {
    file_id: string;
    title: string;
    version: number
    nodes: DynalistNode[]
}