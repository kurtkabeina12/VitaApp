import io from 'socket.io-client';


let socketInstance = null;

export const initSocket = (_token, _tk_type) => {
  const token = _token;
  const tk_type = _tk_type;

  if (!socketInstance) {
    socketInstance = io('http://172.20.15.18:8800', {
      extraHeaders: {
        "authorization": token
      }
    });
  }

  return socketInstance;
};


// export const initSocket = (_token, _tk_type) => {
//   const token = _token;
//   const tk_type = _tk_type;
//   // console.log(token, tk_type, "данные в сокет");
//   const testsocket = io('http://172.20.15.18:8800', {
//     extraHeaders: {
//       "authorization": token + "" + tk_type
//     }
//   });
//
//   return testsocket;
// };

// export const socket = io('http://172.20.15.18:8800');