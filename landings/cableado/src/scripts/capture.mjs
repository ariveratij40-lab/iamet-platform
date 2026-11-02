export function confirmed(response, data) {
  return response.ok && [200,201].includes(response.status) && data?.status === 'saved' && typeof data.receipt === 'string' && /^[a-zA-Z0-9_-]{16,100}$/.test(data.receipt);
}
export function captureEvent(receipt, seen, emit) {
  if (seen.has(receipt)) return false;
  seen.add(receipt);
  emit({event:'lead_captured', receipt, service:'cableado-fibra', landing:'cableado-tijuana'});
  return true;
}
