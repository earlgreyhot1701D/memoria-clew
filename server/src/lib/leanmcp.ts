export class MCPServer {
    constructor(public config: any) { }
    tool(name: string, func: any) { }
    getServer() { return {}; }
}

export async function createHTTPServer(server: any, config: any) {
    console.log('Mock MCP Server started on port', config.port);
    return Promise.resolve();
}

export function Tool(description: string) {
    return function (constructor: Function) {
        // mock decorator
    };
}
