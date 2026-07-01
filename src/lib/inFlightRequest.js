export const createInFlightRequestDeduper = () => {
  const requests = new Map();

  return (key, requestFactory) => {
    if (requests.has(key)) return requests.get(key);

    let request;
    try {
      request = Promise.resolve(requestFactory());
    } catch (error) {
      request = Promise.reject(error);
    }
    requests.set(key, request);
    const clear = () => {
      if (requests.get(key) === request) requests.delete(key);
    };
    request.then(clear, clear);
    return request;
  };
};
