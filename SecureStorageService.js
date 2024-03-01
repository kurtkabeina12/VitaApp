import * as SecureStore from 'expo-secure-store';

export async function getUUID() {
  return await SecureStore.getItemAsync('secure_deviceid');
}

export async function setUUID(uuid) {
  return await SecureStore.setItemAsync('secure_deviceid', uuid);
}

export async function getGCVPToken(){
  return await SecureStore.getItemAsync('gcvp_token')
}

export async function setGCVPToken(gcvPToken){
  return await SecureStore.setItemAsync('gcvp_token', gcvPToken)
}
export async function deleteGCVPToken(){
  return await SecureStore.deleteItemAsync('gcvp_token');
}
