export namespace AI {
	
	export class Command {
	    action: string;
	    path: string;
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new Command(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.action = source["action"];
	        this.path = source["path"];
	        this.name = source["name"];
	    }
	}
	export class ItemSummary {
	    name: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new ItemSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	    }
	}
	export class RecommendMoveResponse {
	    paths: string[];
	
	    static createFrom(source: any = {}) {
	        return new RecommendMoveResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.paths = source["paths"];
	    }
	}
	export class SummarizeResponse {
	    items: ItemSummary[];
	    summary: string;
	
	    static createFrom(source: any = {}) {
	        return new SummarizeResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.items = this.convertValues(source["items"], ItemSummary);
	        this.summary = source["summary"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace backend {
	
	export class FileItem {
	    name: string;
	    path: string;
	    isDirectory: boolean;
	    isApp: boolean;
	    size: number;
	    modifiedTime: string;
	    iconPath: string;
	
	    static createFrom(source: any = {}) {
	        return new FileItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.isDirectory = source["isDirectory"];
	        this.isApp = source["isApp"];
	        this.size = source["size"];
	        this.modifiedTime = source["modifiedTime"];
	        this.iconPath = source["iconPath"];
	    }
	}
	export class Folder {
	    name: string;
	    path: string;
	    icon: string;
	
	    static createFrom(source: any = {}) {
	        return new Folder(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.icon = source["icon"];
	    }
	}

}

export namespace connections {
	
	export class GmailMessage {
	    id: string;
	    subject: string;
	    from: string;
	    snippet: string;
	    date: string;
	
	    static createFrom(source: any = {}) {
	        return new GmailMessage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.subject = source["subject"];
	        this.from = source["from"];
	        this.snippet = source["snippet"];
	        this.date = source["date"];
	    }
	}
	export class GoogleFile {
	    id: string;
	    name: string;
	    mimeType: string;
	    webLink: string;
	
	    static createFrom(source: any = {}) {
	        return new GoogleFile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.mimeType = source["mimeType"];
	        this.webLink = source["webLink"];
	    }
	}

}

export namespace entity {
	
	export class FolderNode {
	    name: string;
	    path: string;
	    isProject: boolean;
	    children: FolderNode[];
	    fileCount: number;
	
	    static createFrom(source: any = {}) {
	        return new FolderNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.isProject = source["isProject"];
	        this.children = this.convertValues(source["children"], FolderNode);
	        this.fileCount = source["fileCount"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace search {
	
	export class SearchResult {
	    fileItem: backend.FileItem;
	    matchType: string;
	    matchedLine: string;
	
	    static createFrom(source: any = {}) {
	        return new SearchResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.fileItem = this.convertValues(source["fileItem"], backend.FileItem);
	        this.matchType = source["matchType"];
	        this.matchedLine = source["matchedLine"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

