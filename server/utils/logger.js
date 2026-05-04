function emit(level, event, payload) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...payload })
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const log = {
  info: (event, payload = {}) => emit('info', event, payload),
  warn: (event, payload = {}) => emit('warn', event, payload),
  error: (event, payload = {}) => emit('error', event, payload),
}
