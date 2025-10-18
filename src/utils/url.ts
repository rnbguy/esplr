export function addProtocol(url: string) {
  if (url.startsWith('127.0.0.1') || url.startsWith('localhost')) {
    return `http://${url}`;
  }
  return `https://${url}`;
}

export function hasValidProtocol(url: string) {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.protocol === 'http:' ||
      parsedUrl.protocol === 'https:' ||
      parsedUrl.protocol === 'localhost:'
    );
  } catch {
    return true;
  }
}

export function hasProtocol(url: string) {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === 'localhost:') {
      return false;
    }
    return parsedUrl.protocol.length > 0;
  } catch {
    return false; // Invalid URL
  }
}

export function ipfsResolve(url: string) {
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  return url;
}
