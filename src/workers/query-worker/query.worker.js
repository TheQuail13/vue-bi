import alasql from "alasql";

addEventListener('message', event => { 
    const results = alasql(event.data.message.query, [event.data.message.data])

    postMessage(results);
})