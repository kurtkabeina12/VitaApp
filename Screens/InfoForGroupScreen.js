import React, {useEffect, useLayoutEffect, useState} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Platform, ScrollView, FlatList, TextInput} from 'react-native';
import { Avatar, Card, Image, Input } from 'react-native-elements';
import * as Device from "expo-device";
import { deleteGCVPToken, getUUID } from "../SecureStorageService";
import {AntDesign, MaterialCommunityIcons} from "@expo/vector-icons";
import {useNavigation} from "@react-navigation/native";

export default function InfoForGroupScreen({ route }) {
  const { token, tk_type, isDarkTheme, isGroup } = route.params || {};
  const [uuid, setUuid] = useState(null);
  const roomId = Array.isArray(route.params.roomId) ? route.params.roomId.map(room => room.id)[0] : route.params.roomId;
  const [users, setUsers] = useState([]);
  const navigation = useNavigation();
  const [showParticipants, setShowParticipants] = useState(true);
  const [showMedia, setShowMedia] = useState(false);
  const [mediaImages, setMediaImages] = useState([]);
  const [flatListKey, setFlatListKey] = useState(0);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchItem, setSearchItem] = useState('');

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const uuid = await getUUID();
        setUuid(uuid);
      } catch (error) {
        console.error('Error fetching token:', error);
      }
    };

    fetchToken();
  }, []);

  useEffect(() => {
    if(isGroup){
      fetch('http://172.20.15.18:8000/chat_info', {
        headers: {
          'Content-Type': 'application/json',
          'authorization': tk_type + " " + token,
          'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
        },
        body: JSON.stringify({
          roomId: roomId,
        }),
        method: 'POST',
      })
        .then((response) => response.json())
        .then(async (data) => {
          setUsers(data);
          console.log(data)
          const avatars = {};

          for (const user of data) {
            const avatarDataUrl = await fetchImage(user.avatar_is);
            avatars[user.avatar_is] = avatarDataUrl;
          }

          setUsers(data.map(user => ({ ...user, avatarDataUrl: avatars[user.avatar_is] })));
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    }else{
      ShowMedia();
      console.log('not group')
    }

  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle:"Информация о группе",
      headerTitleStyle:{
        color:isDarkTheme ? "white" : "black",
      },
      headerStyle: {
        backgroundColor: isDarkTheme ? "#18181b" : "#f8fafc",
      },
    })
  }, []);

  const fetchImage = async (imageName) => {
    const response = await fetch(`http://172.20.15.18:8000/pics/${imageName}`, {
      headers: {
        'Content-Type': 'application/json',
        'authorization': tk_type + " " + token,
        'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
      },
    });
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const renderItem = ({ item, index }) => {
    return (
      <View style={styles.containerAdmin} key={index}>
        <Avatar size={50} rounded source={{ uri: item.avatarDataUrl }} />
        <Text style={{ color: isDarkTheme ? "white" : "black" }}>{item.shortname}</Text>
        {item.room_admin && <MaterialCommunityIcons name="crown" size={25} color="#eab308" style={{ marginRight:10, position: 'absolute', right:  0 }} />}
      </View>
    );
  };

  const ShowParticipants = () => {
      setShowParticipants(true);
      setShowMedia(false);
    setFlatListKey(prevKey => prevKey +  1);
  }

  const searchMessage = () => {
  setShowSearchInput(!showSearchInput);
  }

  const ShowDocuments = () => {
  }

  const ShowMedia = () => {
    fetch('http://172.20.15.18:8000/chat_media', {
      headers: {
        'Content-Type': 'application/json',
        'authorization': tk_type + " " + token,
        'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
      },
      body: JSON.stringify({
        roomId: roomId,
      }),
      method: 'POST',
    })
      .then((response) => response.json())
      .then(async (data) => {
        const mediaImages = await Promise.all(data.map(item => fetchImage(item.msgimg)));
        setMediaImages(mediaImages);
        console.log(data, 'ответ с сервера Media')
      })
      .catch((error) => {
        console.error('Error:', error);
      });
    setShowMedia(true);
    setShowParticipants(false);
    setFlatListKey(prevKey => prevKey +  1);
    console.log("Media button pressed");
  }
  const renderImageItem = ({ item, index }) => {
    return (
      <Image
        key={index}
        source={{ uri: item }}
        style={{ width:  200, height:  200 }}
      />
    );
  };
  return (
    <>
      <View style={{
        borderWidth:  1,
        borderBottomColor: isDarkTheme ? '#2b2b2f' : "rgba(204,204,204,0.63)",
        borderTopColor: isDarkTheme ? '#2b2b2f' : "rgba(204,204,204,0.63)",
        backgroundColor: isDarkTheme ? "#18181b" : "#f8fafc",
        minHeight:  50,
        flexDirection: "row",
        alignItems: "center",
        // justifyContent: 'space-between'
        justifyContent:"center",
        gap:50
      }}>
        {isGroup && (
          <TouchableOpacity onPress={ShowParticipants}>
            <Text style={{ color: showParticipants ? '#2563eb' : (isDarkTheme ? "white" : "black"),  }}>Участники</Text>
         </TouchableOpacity>
        )}
        <TouchableOpacity onPress={ShowMedia}>
          <Text style={{ color: showMedia ? '#2563eb' : (isDarkTheme ? "white" : "black"),  }}>Медиа</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={ShowDocuments}>
          <Text style={{color: isDarkTheme ? "white" : "black", marginRight:10}}>Файлы</Text>
        </TouchableOpacity>
        <AntDesign name="search1" size={24} onPress={searchMessage}  color={isDarkTheme ? "white" : "black"} />
        {showSearchInput && (
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              height: 40,
              borderColor: isDarkTheme ? "#16161a" : "#dddddd",
              borderRadius: 20,
              color:isDarkTheme ? "white" : "black",
              paddingHorizontal: 10,
            }}
            keyboardAppearance={isDarkTheme ? 'dark' : 'light'}
            placeholderTextColor={isDarkTheme ? "#404040" : "black"}
            backgroundColor={isDarkTheme ? "#1d1d21" : "#F0F0F0"}
            placeholder='Поиск...'
            onChangeText={setSearchItem}
            value={searchItem}
          />
        )}
      </View>
      {showParticipants &&  isGroup && (
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          ItemSeparatorComponent={() => <View style={{
            height:  1,
            backgroundColor:isDarkTheme ? "#4f4f4f" : "rgba(204,204,204,0.63)",
            marginLeft:  10,
            marginRight:  10,
          }} />}
          style={isDarkTheme ? styles.containerDark : ""}
        />
      )}
      {showMedia && (
        <FlatList
          data={mediaImages}
          key={flatListKey}
          renderItem={renderImageItem}
          numColumns={2}
          keyExtractor={(item, index) => index.toString()}
          style={isDarkTheme ? styles.containerDark : ""}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  AdminName:{
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    fontSize:15,
    fontWeight:"bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'space-between',
    borderBottomWidth:  1,
    borderBottomColor: "#D0D0D0",
  },
  headerText: {
    marginLeft:  5,
    marginRight:  5,
  },
  selectedHeaderText: {
    color: "blue",
    textDecorationLine: 'underline',
  },
  containerDark:{
    backgroundColor:"black"
  },
  UsersName:{
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    fontSize:15,
    fontWeight:"bold"
  },
  separator: {
    height:  1,
    backgroundColor: "#4f4f4f",
    marginLeft:  10,
    marginRight:  10,
  },
  UsersNameDark:{
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    fontSize:15,
    fontWeight:"bold",
    color:"white"
  },
  containerAdmin: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
  },
  Titlecontainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  buttonStyle: {
    borderWidth: 1,
    borderColor: "#D0D0D0",
  },
});
