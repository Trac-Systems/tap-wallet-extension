import axios, {AxiosInstance} from 'axios';

export class AxiosRequest {
  api: AxiosInstance;
  baseUrl: string;
  constructor(options: {baseUrl: string; apiKey?: string}) {
    this.baseUrl = options.baseUrl;
    const headers: any = {
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
    };
    if (options.apiKey) {
      headers.Authorization = `Bearer ${options.apiKey}`;
    }
    this.api = axios.create({
      baseURL: options.baseUrl,
      timeout: 15000, // Request timeout in milliseconds
      headers,
    });

    this.api.interceptors.request.use(
      async config => {
        return config;
      },
      function (error) {
        Promise.reject(error);
      },
    );

    this.api.interceptors.response.use(
      function (response) {
        return response;
      },
      async function (err) {
        Promise.reject(err);
      },
    );
  }
  get = async (endpoint: string, params: any) => {
    const response = await this.api.get(endpoint, {params});
    return await Promise.resolve({
      success: true,
      message: response?.statusText,
      statusCode: response?.status,
      data: response?.data,
    });
  };

  post = async (endpoint: string, bodyData: any, reqHeaders?: any) => {
    try {
      const headers = {
        ...reqHeaders,
        'X-Tapwallet-Agent': 'tap-wallet',
      };
      console.log('headers', headers);
      const response = await this.api.post(endpoint, bodyData, {
        headers,
      });
      if (response && response.status >= 200 && response.status < 300) {
        return await Promise.resolve({
          success: true,
          message: response.statusText,
          statusCode: response.status,
          data: response.data,
        });
      }
    } catch (error: any) {
      const {response} = error;
      let msg;
      let statusCode;
      if (response && response instanceof Object) {
        const {data, statusText} = response;
        statusCode = response.status;
        msg = data?.message || statusText;
      } else {
        statusCode = 600;
        msg = error?.message || 'Network Error';
      }
      return Promise.reject({
        success: false,
        statusCode,
        message: msg,
      });
    }
  };

  put = async (endpoint: string, bodyData: any) => {
    try {
      const response = await this.api.put(endpoint, bodyData);
      if (response && response.status >= 200 && response.status < 300) {
        return await Promise.resolve({
          success: true,
          message: response.statusText,
          statusCode: response.status,
          data: response.data,
        });
      }
    } catch (error: any) {
      const {response} = error;
      let msg;
      let statusCode;
      if (response && response instanceof Object) {
        const {data, statusText} = response;
        statusCode = response.status;
        msg = data?.message || statusText;
      } else {
        statusCode = 600;
        msg = error?.message || 'Network Error';
      }
      return Promise.reject({
        success: false,
        statusCode,
        message: msg,
      });
    }
  };

  postAsPlainText = async (endpoint: string, data: string) => {
    try {
      const url = `${this.url()}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'text/plain',
        },
      };
      const response = await axios.post(url, data, config);
      return response;
    } catch (error) {
      if (error.response) {
        // Server responded with a status code that falls out of the range of 2xx
        if (!error.response?.data) {
          throw Error(error);
        }
        const extractFeeError = errorMessage => {
          try {
            // Extract the JSON part of the error message
            const jsonPart = errorMessage.match(/\{.*\}/);
            if (jsonPart) {
              const errorObj = JSON.parse(jsonPart[0]);
              const errorMsg = errorObj.message;
              if (errorMsg) return errorMsg;
            }
            return 'An error occurred, but no specific fee information was found.';
          } catch (err) {
            return 'Error parsing the error message.';
          }
        };
        throw Error(extractFeeError(error.response?.data));
      } else if (error.request) {
        // The request was made but no response was received
        throw Error('No response received from server');
      } else {
        // Something else happened in setting up the request
        throw Error(error);
      }
    }
  };

  url = () => {
    return this.api.getUri();
  };
}
