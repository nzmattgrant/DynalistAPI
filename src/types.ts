export interface SendToInboxParameters {
    token?: string,
    content?: string,
    index?: number,
    note?: string, 
    checked?: boolean, 
    checkbox?: boolean, 
    heading?: number,
    color?: number
}

export interface CreateNodeParameters {
    action: string;
    type: string;
    parent_id: string;
    index: number;
    title?: string;
}

export interface EditNodeParameters {
    action: string;
    type: string;
    file_id: string;
    title: string;
}

export interface DocumentUpdateResponse {
    _code: string; // succeeded, an error code will be returned otherwise
    _msg: string;
    new_node_ids: string[]
}

export interface CheckForUpdatesResponse {
    _code: string;
    _msg: string;
    versions: { [key: string]: number };
}

export interface UploadFileResponse {
    _code: string;
    _msg: string;
    url: string;
}

export interface GetPreferenceResponse {
    _code: string;
    _msg: string;
    key: string;
    value: string;
}

export interface DynalistNode {
    id: string;
    content: string;
    note: string;
    created: number, // timestamp in milliseconds of the creation time
    modified: number, // timestamp in milliseconds of the last modified time
    children: string[],
    checkbox?: boolean,
    checked?: boolean,
    color?: number,// color label, 0~6
    heading?: number,// heading level, 0~3
    collapsed?: boolean
}

export interface DynalistDocument {
    file_id: string;
    title: string;
    version: number
    nodes: DynalistNode[]
}

export interface DynalistFile {
    id: string;
    title: string;
    type: 'document' | 'folder';
    permission: number;
    collapsed?: boolean;
    children?: string[];
}

export interface FileListResponse {
    _code: string;
    _msg: string;
    root_file_id: string;
    files: DynalistFile[];
}

export interface FileUpdateResponse {
    _code: string;
    _msg: string;
    results: boolean[];
    created?: string[];
}

export interface NodeCreationOptions {
    note?: string;
    checked?: boolean;
    checkbox?: boolean;
    heading?: number;
    color?: number;
}

export interface DynalistNodeTree {
    id: string,
    content: string,
    checked: boolean,
    children: DynalistNodeTree[]
}

export interface FileLevelChangeParameters {
    
    action: string,//edit/move/create
    type: string,//document/folder
    file_id?: string,
    title?: string,
    parent_id?: string,
    index?: number
}

export interface DocumentLevelChangeParameters {
    action: string,//insert/edit/move/delete
    node_id?: string, 
    parent_id?: string,
    index?: number
    content?: string,
    note?: string,
    checked?: boolean,
    checkbox?: boolean,
    heading?: number,
    color?: number,
}