const worker = new Worker('./query.worker.js', { type: 'module' });

const send = message => worker.postMessage({
  message
})

export default {
  worker,
  send
}