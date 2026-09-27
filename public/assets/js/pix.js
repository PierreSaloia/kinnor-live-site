function tlv(id, value) { return `${id}${String(value.length).padStart(2, '0')}${value}`; }
function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i += 1) {
    crc ^= str.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b += 1) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
const ascii = (s, max) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]/g, '').slice(0, max);
export function pixCode({ key, name, city, amount, message = 'Kinnor Live', txid = '***' }) {
  const account = tlv('00', 'br.gov.bcb.pix') + tlv('01', key.trim()) + (message ? tlv('02', ascii(message, 40)) : '');
  let payload = tlv('00', '01') + tlv('26', account) + tlv('52', '0000') + tlv('53', '986')
    + (amount > 0 ? tlv('54', amount.toFixed(2)) : '') + tlv('58', 'BR') + tlv('59', ascii(name, 25))
    + tlv('60', ascii(city, 15)) + tlv('62', tlv('05', txid));
  payload += '6304';
  return payload + crc16(payload);
}
