const worker = new Worker('./xlsx-parser.worker.js', { type: 'module' });

const send = message => worker.postMessage({
  message
})

export default {
  worker,
  send
}