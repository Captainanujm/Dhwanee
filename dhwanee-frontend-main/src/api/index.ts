import axios from "axios";

export const getFromApi = <T>(
  endpoint: string,
  token: string,
  params?: { [index: string]: string }
): Promise<T> => {
  return new Promise((resolve, reject) => {
    axios
      .get(endpoint, {
        headers: {
          Authorization: "Token " + token,
        },
        params,
      })
      .then((response) => resolve(response.data))
      .catch((error) => {
        if (error.response !== undefined)
          reject({
            status: error.response.status,
            statusText: error.response.statusText,
            response: error.response.data,
          });
        else
          reject({
            status: 0,
            statusText: "Unknown Error",
            response: undefined,
          });
      });
  });
};

export const postToApi = <T>(
  endpoint: string,
  token: string,
  data?: any
): Promise<T> => {
  var headers: { [key: string]: string } = {
    Authorization: "Token " + token,
  };
  if (token === "") {
    headers = {};
  }
  return new Promise((resolve, reject) => {
    axios
      .post(endpoint, data, {
        headers,
      })
      .then((response) => resolve(response.data))
      .catch((error) => {
        if (error.response !== undefined)
          reject({
            status: error.response.status,
            statusText: error.response.statusText,
            response: error.response.data,
          });
        else
          reject({
            status: 0,
            statusText: "Unknown Error",
            response: undefined,
          });
      });
  });
};

export const putToApi = <T>(
  endpoint: string,
  token: string,
  data?: any
): Promise<T> => {
  return new Promise((resolve, reject) => {
    axios
      .put(endpoint, data, {
        headers: {
          Authorization: "Token " + token,
        },
      })
      .then((response) => resolve(response.data))
      .catch((error) => {
        if (error.response !== undefined)
          reject({
            status: error.response.status,
            statusText: error.response.statusText,
            response: error.response.data,
          });
        else
          reject({
            status: 0,
            statusText: "Unknown Error",
            response: undefined,
          });
      });
  });
};

export const patchApi = <T>(
  endpoint: string,
  token: string,
  data?: any
): Promise<T> => {
  return new Promise((resolve, reject) => {
    axios
      .patch(endpoint, data, {
        headers: {
          Authorization: "Token " + token,
        },
      })
      .then((response) => resolve(response.data))
      .catch((error) => {
        if (error.response !== undefined)
          reject({
            status: error.response.status,
            statusText: error.response.statusText,
            response: error.response.data,
          });
        else
          reject({
            status: 0,
            statusText: "Unknown Error",
            response: undefined,
          });
      });
  });
};

export const deleteApi = <T>(
  endpoint: string,
  token: string
): Promise<T> => {
  return new Promise((resolve, reject) => {
    axios
      .delete(endpoint, {
        headers: {
          Authorization: "Token " + token,
        },
      })
      .then((response) => resolve(response.data))
      .catch((error) => {
        if (error.response !== undefined)
          reject({
            status: error.response.status,
            statusText: error.response.statusText,
            response: error.response.data,
          });
        else
          reject({
            status: 0,
            statusText: "Unknown Error",
            response: undefined,
          });
      });
  });
};

const methods = { getFromApi, postToApi, putToApi, patchApi, deleteApi };
export default methods;
