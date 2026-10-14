/**
 * Polyfill de Web Cryptography API (window.crypto.subtle) para contextos HTTP.
 * Permite que Microsoft MSAL Browser (@azure/msal-browser) funcione sobre IPs públicas HTTP
 * (ej: http://100.26.45.41) generando los desafíos PKCE (SHA-256) sin lanzar crypto_non_existent.
 */

// Implementación pura de SHA-256 para digest("SHA-256", data)
function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i, j;
  let result = '';

  const words = [];
  const asciiBitLength = ascii.length * 8;

  const hash = [];
  const k = [];
  let primeCounter = 0;

  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return; // Caracteres no compatibles
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15],
        w2 = w[i - 2];

      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] =
        i < 16
          ? w[i]
          : (w[i - 16] + s0 + w[i - 7] + s1) | 0;

      const s1_ch =
        rightRotate(hash[4], 6) ^
        rightRotate(hash[4], 11) ^
        rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1_ch + ch + k[i] + w[i]) | 0;
      const s0_maj =
        rightRotate(hash[0], 2) ^
        rightRotate(hash[0], 13) ^
        rightRotate(hash[0], 22);
      const maj =
        (hash[0] & hash[1]) ^
        (hash[0] & hash[2]) ^
        (hash[1] & hash[2]);
      const temp2 = (s0_maj + maj) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  const buffer = new ArrayBuffer(32);
  const dataView = new DataView(buffer);
  for (i = 0; i < 8; i++) {
    dataView.setUint32(i * 4, hash[i], false);
  }
  return buffer;
}

export function initCryptoPolyfill() {
  if (typeof window === 'undefined') return;

  if (!window.crypto) {
    window.crypto = {};
  }

  // getRandomValues fallback
  if (!window.crypto.getRandomValues) {
    window.crypto.getRandomValues = function (array) {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    };
  }

  // SubtleCrypto fallback para digest SHA-256 en HTTP
  if (!window.crypto.subtle) {
    console.info("[Pedidos360] Activando Polyfill de window.crypto.subtle para HTTP IP pública");
    window.crypto.subtle = {
      digest: async function (algorithm, data) {
        let binaryStr = '';
        const bytes = new Uint8Array(data);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binaryStr += String.fromCharCode(bytes[i]);
        }
        return sha256(binaryStr);
      },
    };
  }
}

// Ejecutar inmediatamente al importar
initCryptoPolyfill();
