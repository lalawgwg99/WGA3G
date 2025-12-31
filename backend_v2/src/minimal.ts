export default {
    async fetch(request: Request, env: any, ctx: any): Promise<Response> {
        return new Response("Hello from minimal worker!", { status: 200 });
    },
};
