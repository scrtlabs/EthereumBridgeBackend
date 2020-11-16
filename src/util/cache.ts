import NodeCache from "node-cache";

class Cache {
    private static instance: Cache;
    private cache: NodeCache;

    constructor() {
        this.cache = new NodeCache()

    }

    public static getInstance(): Cache {
        if (!Cache.instance) {
            Cache.instance = new Cache();
        }

        return Cache.instance;
    }

    async get(key: NodeCache.Key, retrieveData: () => any) {
        const value = this.cache.get(key);
        if (value) {
            return value;
        }

        const data = await retrieveData()
        this.cache.set(key, data, 120);
        return data;
    }
}

export default Cache;
