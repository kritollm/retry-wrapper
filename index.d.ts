declare function retryWrapper(retries: number | ((error, tried: number, lapsed: number, resolve: (value?: any) => void, reject: (reason?: any) => void, retry) => any), fn: (...args) => Promise<any>): (...args: any[]) => Promise<{}>;
export { retryWrapper };
export default retryWrapper;
