function retryWrapper(retries: number | ((error, tried: number, lapsed: number, resolve: (value?: any) => void, reject: (reason?: any) => void, retry) => any), fn: (...args) => Promise<any>) {

    let tryCallBack: (error, tried: number, lapsed: number, resolve: (value?: any) => void, reject: (reason?: any) => void, retry) => any;
    if (typeof (retries) != 'function') {
        //If no function and no number, retry 5 times.
        if (!retries || isNaN(retries)) {
            retries = 5;
        }
        tryCallBack = (error, tried, lapsed, resolve, reject, retry) => {
            if (tried > retries) {
                return reject(error);
            }
            retry(tried * 200);
        };
    } else {
        tryCallBack = retries;
    }
    return (...args) => {
        const started = Date.now();
        let tried = 0;

        return new Promise((resolve, reject) => {
            function execute(timeOut) {
                tried++;
                setTimeout(() => fn(...args)
                    .then(result => resolve(result))
                    .catch(e => tryCallBack(e, tried, Date.now() - started, resolve, reject, execute)),
                    timeOut);
            }
            execute(0);
        });
    }
}
export { retryWrapper };
export default retryWrapper;