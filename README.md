# retry-wrapper - Easily add retry logic to any function returning a Promise.

## Reason

I was tired of making custom made spaghetti retry logic when I occasionally needed it.

## Usage

```bash
$ npm install -S retry-wrapper
```

```javascript
// var retryWrapper = require(retry-wrapper).retryWrapper;
import { retryWrapper } from 'retry-wrapper';

let myAsyncFunctionWithRetryLogic = retryWrapper(4, myAsyncFunction);

myAsyncFunctionWithRetryLogic('https://unstable.com/api/findSomething?thing=something')
    .then(r => {
        //..Do something with result
    })
    .catch(e => {
        // Retry 4 times was not enough,
        // do something with the error
    });
```

## Example

```javascript
import { retryWrapper } from 'retry-wrapper';

function doSomething(r) {
    console.log(r);
}

let retry = {};
function simulateRequest(req) {
    // --- To log retries ---
    retry[req] = retry[req] || 0;
    // ----------------------

    return new Promise((resolve, reject) => {

        var random = Math.floor(Math.random() * 10);
        // ---------------------------
        setTimeout(() => {
            retry[req]++;
            if (random < 7) {
                return reject(`${req}, failed at try ${retry[req]}`);
            }
            return resolve(req);
        }, random);
    });
}

let retryWrapped = retryWrapper(4, simulateRequest);
let promises = [];

for (let i = 0, l = 100; i < l; i++) {
    // 
    promises.push(retryWrapped(i)
        .then(result => ({ error: null, result }))
        // Catch so Promise.all(promises) isn't rejected if
        // retry fails.
        .catch(error => ({ error, result: null }));
    );
}

Promise.all(promises)
    .then(res => {
        // Do something with the array of results
        res.forEach(r => doSomething(r));
    });
```

## Custom retry logic

```javascript
import { retryWrapper } from 'retry-wrapper';

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

let retryWrapped = retryWrapper(tryCallBack, simulateRequest);
```

## Tips

You can use it with retry-wrapper to also add retry logic to your async function.

```bash
$ npm install -S concurrent-wrapper retry-wrapper
```

```javascript
// var concurrentWrapper = require(concurrent-wrapper).concurrentWrapper;
import { concurrentWrapper } from 'concurrent-wrapper';
// var retryWrapper = require(retry-wrapper).retryWrapper;
import { retryWrapper } from 'retry-wrapper';

// random order of execution
let retryAndConcurrentWrapped = retryWrapper(5, concurrentWrapper(5, myRequestFunction));
// synced order of execution
//let retryAndConcurrentWrapped = concurrentWrapper(5, retryWrapper(5, myRequestFunction));
for (let i = 0, l = 1000; i < l; i++) {
    retryAndConcurrentWrapped(i).then(console.log.bind(console)).catch(console.error.bind(console))
  }
```