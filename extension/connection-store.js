// This database belongs to the extension's origin. Content scripts use the page's origin.
let opening;

function database() {
  if (!opening) {
    opening = new Promise((resolve, reject) => {
      const request = indexedDB.open("baby-pet", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("connection");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }).catch((error) => {
      opening = undefined;
      throw error;
    });
  }
  return opening;
}

export async function readConnection() {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction("connection", "readonly").objectStore("connection").get("hosted");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveConnection(connection) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("connection", "readwrite");
    const store = transaction.objectStore("connection");
    if (connection) store.put(connection, "hosted");
    else store.delete("hosted");
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error);
  });
}
