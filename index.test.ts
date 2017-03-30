// Stupid to use a library for this simple test, but to use hours to write test and debug the tests because
// it can't handle async code and promises is more important than productivity :)

import { retryWrapper } from '.';
let tryCallBack = (error, tried, lapsed, resolve, reject, retry) => {
    if (tried > 100) {
        // 
        return reject({ error: { original: error, custom: "maxTries" } });
        // or resolve(error) if you hate to catch
    }
    if (lapsed > (1000 * 60 * 60)) {
        // Retried more than one hour, so take a break
        return reject({ error: { original: error, custom: "lapsed" } });
    }

    let timeOut = (Math.random() * tried * 200) + 100;
    retry(timeOut);
};
test('async-wrapper', done => {
    let maxRetries = 5;
    let retry = {};
    function simulateRequest(req) {
        // --- To log retries ---
        retry[req] = retry[req] || 0;
        // ----------------------

        // Can't retry a promise, need to restart before the promise is made.
        return new Promise((resolve, reject) => {

            var random = Math.floor(Math.random() * 10);
            // ---------------------------
            setTimeout(() => {
                //parallelRequests--;
                retry[req]++;
                if (random < 7) {
                    return reject(`${req}, failed at try ${retry[req]}`);
                }
                return resolve(req);
            }, random);
        });
    }
    //Same callback as the default, just lower timeouts to avoid timeout exception from
    // jasmine

    let tryCallBack = (error, tried, lapsed, resolve, reject, retry) => {
        if (tried > maxRetries) {
            return reject(error);
        }
        retry(tried * 1);
    };
    let retryWrapped = retryWrapper(maxRetries, simulateRequest);
    let promises = [];
    //expect(Promise.reject(4)).reject;
    for (let i = 0, l = 100; i < l; i++) {
        promises.push(retryWrapped(i).catch(e => e))
    }
    return Promise.all(promises)
        .then(res => {
            //console.log(res);
            res.forEach((r: string, i: number) => {
                if (r && r.indexOf && r.indexOf('failed') > -1) {
                    // 1 retry is 2 tries.
                    expect(r).toBe(`${i}, failed at try ${maxRetries + 1}`);
                } else {
                    expect(r).toBe(i);
                }
            });
            done();
        })
});