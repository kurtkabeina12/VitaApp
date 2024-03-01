import { Button, Image, Pressable, ScrollView, StyleSheet, Text, View, SectionList, TextInput } from 'react-native'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useNavigation } from '@react-navigation/native';
import BouncyCheckbox from "react-native-bouncy-checkbox";
// import socket from '../Socket';
import { getUUID } from '../SecureStorageService';
import * as Device from "expo-device";
import {initSocket} from '../Socket';
import { Platform } from 'react-native';
import {AntDesign, FontAwesome} from "@expo/vector-icons";
export default function AddChatScreenTest({ route }) {
  const [users, setUsers] = useState([]);
  const navigation = useNavigation();
  const { gcvplk_tk_uid, token, tk_type, tokenDlyDelete} = route.params || {};
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [images, setImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  // console.log(gcvplk_tk_uid)
  const [admin, setAdmin] = useState("");
  const [uuid, setUuid] = useState(null);
  const socket = initSocket(token, tk_type);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const uuid = await getUUID();
        setUuid(uuid);
        console.log(uuid);
      } catch (error) {
        console.error('Error fetching token:', error);
      }
    };

    fetchToken();
  }, []);

  useEffect(() => {
    //получаем всех юзеров
    fetch('http://172.20.15.18:8000/get_staff', {
      headers: {
        'Content-Type': 'application/json',
        'authorization': tk_type + " " + token,
        'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
      }
    })
      .then((response) => response.json())
      .then((data) => {
        // console.log(data)

        const filteredData = data.filter(user => user.id !== Number(gcvplk_tk_uid));
        const AdminUser = data.filter(user => user.id === Number(gcvplk_tk_uid));
        setAdmin(AdminUser)
        const usersWithSelection = filteredData.map(user => ({ ...user, isSelected: false }));
        setUsers(usersWithSelection);

        const imgArray = usersWithSelection.map(user => user.img);

          const requests = imgArray.map(img =>
            fetch(`http://172.20.15.18:8000/pics/${img}`, {
              headers: {
                'Content-Type': 'application/json',
                'authorization': tk_type + " " + token,
                'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
              }
            })
              .then((response) => response.blob())
              .then((blob) => {
                return new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    resolve(reader.result);
                  };
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                });
              })
              .catch((error) => {
                console.error('Error fetching pics:', error);
                return null;
              })
          );
          Promise.all(requests)
            .then((imageUrls) => {
              setImages(imageUrls);
              // console.log(imageUrls);
            });

      })
      .catch((error) => {
        console.error('Error fetching spr_staff:', error);
      });
  }, []);

  useEffect(() => {
    const { theme } = route.params;
    setIsDarkTheme(theme === "dark");
  }, [route.params]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        selectedUsers.length >= 2 ? (
          <Button
            title="Далее"
            onPress={() => handleNext()}
          />
        ) : null
      ),
    });
    console.log(selectedUsers)
  }, [navigation, selectedUsers]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Добавить чат",
      headerTitleStyle: {
        color: isDarkTheme ? "white" : "black",
      },
      headerStyle: {
        backgroundColor: isDarkTheme ? "#18181b" : "#ffffff",
      },
    });

    navigation.setOptions({
      headerRight: () => (
        selectedUsers.length >= 2 && showCheckboxes ? (
          <Button
            title="Далее"
            onPress={() => handleNext()}
          />
        ) : null
      ),
    });
  }, [navigation, selectedUsers, showCheckboxes, isDarkTheme]);

  const navigateChat = async (user) => {
    //запрос для создания комнаты
    // let userName = users.find(user => user.id === gcvplk_tk_uid);
    // const userName = users.find(u => u.id === Number(gcvplk_tk_uid));
    const recipientName = user.shortname;
    console.log(recipientName)
    try {
      const checkChatResponse = await fetch('http://172.20.15.18:8000/check_chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': tk_type + " " + token,
          'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
        },
        body: JSON.stringify({
          staff_id_User: gcvplk_tk_uid,
          staff_id: user.id
        }),
      });
      const checkChatData = await checkChatResponse.json();
      console.log('Success:', checkChatData);
      const roomId = checkChatData[0].room_id;
      console.log('roomId', roomId)
      navigation.navigate("Messages", {
        userId: gcvplk_tk_uid,
        roomId: roomId,
        theme: isDarkTheme ? "dark" : "light",
        chatTitle: recipientName,
        token: token,
        tk_type: tk_type,
        tokenDlyDelete:tokenDlyDelete
      });
      socket.emit('join', { roomId: roomId }, (response) => {
        console.log('Received data from server:', response);
      });

    } catch (error) {
      console.error('Error:', error);
    }
  }
  const toggleUserSelection = (user) => {
    if (showCheckboxes) {
      setUsers(users => users.map((u) => {
        if (u.id === user.id) {
          const updatedUser = { ...u, isSelected: !u.isSelected };
          if (updatedUser.isSelected) {
            setSelectedUsers(prevSelectedUsers => [...prevSelectedUsers, updatedUser]);
          } else {
            setSelectedUsers(prevSelectedUsers => prevSelectedUsers.filter(u => u.id !== updatedUser.id));
          }
          return updatedUser;
        }
        return u;
      }));
    }
  };

  const resetCheckboxes = () => {
    setUsers(users => users.map(user => ({ ...user, isSelected: false })));
    setSelectedUsers([]);
  };

  const handleNext = () => {
    console.log(admin[0].shortname)
    const userName = admin[0].shortname;
    console.log(users)
    navigation.navigate('AddGroupChat', {
      theme: isDarkTheme ? "dark" : "light",
      userId: gcvplk_tk_uid,
      userName: userName,
      Admin:admin,
      selectedUsers: selectedUsers,
      token: token,
      tk_type: tk_type,
      tokenDlyDelete:tokenDlyDelete
    });
  };


  const usersWithImages = users.map((user, index) => ({
    ...user,
    imageUrl: images[index] || null,
  }));

  usersWithImages.sort((a, b) => a.shortname.localeCompare(b.shortname));
  let data = usersWithImages.reduce((r, e) => {
    let group = e.shortname[0];
    if(!r[group]) r[group] = {group, children: [e]}
    else r[group].children.push(e);
    return r;
  }, {});

  let groupedUsersWithImages = Object.values(data);

  let filteredGroupsWithImages = [];
  if (searchTerm === "") {
    filteredGroupsWithImages = groupedUsersWithImages;
  } else {
    filteredGroupsWithImages = groupedUsersWithImages.map(group => {
      return {
        ...group,
        children: group.children.filter(user =>
          user.shortname && user.shortname.toLowerCase().includes(searchTerm.toLowerCase())
        ),
      };
    });
  }


  console.log(searchTerm)
  console.log(filteredGroupsWithImages)

  return (
      <View style={{ flex: 1, backgroundColor: isDarkTheme ? "#09090b" : "white" }}>
        <View style={{display:'flex', flexDirection:'row', alignSelf:'center', marginTop:1, marginBottom:15 }}>
          <TextInput
            style={{width: '90%', height:30, borderRadius:10, marginTop:10, color:isDarkTheme ? "white" : "black"}}
            keyboardAppearance={isDarkTheme ? 'dark' : 'light'}
            placeholder='Поиск'
            placeholderTextColor={isDarkTheme ? "#404040" : "black"}
            backgroundColor={isDarkTheme ? "#18181b" : "#F0F0F0"}
            textAlign='center'
            onChangeText={text => setSearchTerm(text)}
          />
        </View>
        {/*<Button*/}
        {/*  title={showCheckboxes ? "Отменить" : "Создать групповой чат"}*/}
        {/*  onPress={() => {*/}
        {/*    setShowCheckboxes(!showCheckboxes);*/}
        {/*    if (!showCheckboxes) {*/}
        {/*      resetCheckboxes();*/}
        {/*    }*/}
        {/*  }}*/}
        {/*  style={styles.buttonStyle}*/}
        {/*/>*/}
        <SectionList
          sections={filteredGroupsWithImages.map(group => ({ title: group.group.toUpperCase(), data: group.children }))}
          keyExtractor={(item, index) => `${item.id}`}
          initialNumToRender={100}
          renderItem={({ item }) => {
            // console.log(item);
            return(
            <Pressable
              key={item.id}
              onPress={() => navigateChat(item)}
              disabled={showCheckboxes}
            >
              <View style={styles.container}>
                {showCheckboxes && (
                  <BouncyCheckbox
                    value={item.isSelected}
                    onPress={() => toggleUserSelection(item)}
                    size={25}
                    fillColor="#3b82f6"
                    unfillColor="#FFFFFF"
                    innerIconStyle={{ borderWidth: 1.5, borderColor: item.isSelected ? "#3b82f6" : '#D0D0D0' }}
                  />
                )}
                <View style={styles.textContainer}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.AvatarStyle}
                  />
                  <Text style={isDarkTheme ? styles.subTextDark : styles.subText}>{item.shortname}</Text>
                </View>
              </View>
            </Pressable>
              )
          }}
          renderSectionHeader={({ section: { title, data } }) => {
            if (data.some(user => user.shortname && user.shortname.toLowerCase().includes(searchTerm.toLowerCase()))) {
              return (
                <View style={isDarkTheme ? styles.containerNameDark : styles.containerName}>
                  <Text style={isDarkTheme ? styles.subTextDarkName : styles.subTextName}>{title}</Text>
                </View>
              );
            }
            return <View />;
          }}
        />
        <View style={{borderRadius:20, backgroundColor:"#696969", marginBottom:15, marginRight:5, position: 'absolute', bottom:0, right:0}}>
          <AntDesign.Button style={{ backgroundColor:"#9b9b9d"}} name={showCheckboxes ? "close" : "addusergroup"} size={30} color="black" onPress={() => {
            setShowCheckboxes(!showCheckboxes);
            if (!showCheckboxes) {
              resetCheckboxes();
            }
          }}/>
          {/*<Button*/}
          {/*  title={showCheckboxes ? "Отменить" : "Создать групповой чат"}*/}
          {/*  onPress={() => {*/}
          {/*    setShowCheckboxes(!showCheckboxes);*/}
          {/*    if (!showCheckboxes) {*/}
          {/*      resetCheckboxes();*/}
          {/*    }*/}
          {/*  }}*/}
          {/*/>*/}
        </View>
      </View>
);
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    // borderWidth: 0.7,
    // borderColor: "#D0D0D0",
    // borderTopWidth: 0,
    // borderLeftWidth: 0,
    // borderRightWidth: 0,
    padding: 10,
  },
  containerName:{
    paddingLeft:20,
    backgroundColor:"#f3f4f6",
  },
  containerNameDark:{
    paddingLeft:20,
    backgroundColor:"#262626",
  },
  AvatarStyle: {
    width: 50,
    height: 50,
    borderRadius: 50,
    marginRight: 10,
  },
  buttonStyle: {
    borderWidth: 1,
    borderColor: "#D0D0D0",
  },
  checkboxes: {

  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
    resizeMode: "cover"
  },
  textContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
  },
  subTextName: {
    marginTop:5,
    marginBottom: 5,
    color: "#6b7280",
    fontWeight: "500"
  },
  subTextDarkName: {
    marginTop:5,
    marginBottom: 5,
    color: "white",
    fontWeight: "500"
  },
  subText: {
    marginTop: 15,
    color: "black",
    fontWeight: "500"
  },
  subTextDark: {
    marginTop: 15,
    color: "white",
    fontWeight: "500"
  },
})
