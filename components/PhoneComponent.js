import React, { useEffect, useState } from 'react';
import {StyleSheet, View, Text, FlatList, Pressable, SectionList} from 'react-native';
import * as Contacts from 'expo-contacts';
import { Platform } from 'react-native';
export default function PhoneComponent() {
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });

        if (data.length > 0) {
          let sortedContacts = data.sort((a, b) => a.name.localeCompare(b.name));

          let contactsByLetter = sortedContacts.reduce((obj, contact) => {
            const firstLetter = contact.name[0].toUpperCase();
            return {
              ...obj,
              [firstLetter]: [...(obj[firstLetter] || []), contact],
            };
          }, {});

          setContacts(contactsByLetter);
        }
      }
    })();
  }, []);

  return (
    <SectionList
      sections={Object.entries(contacts).map(([title, data]) => ({ title, data }))}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index, section }) => (
        <Pressable style={[styles.phoneContact, index < section.data.length - 1 && { borderBottomWidth: 0.7, paddingBottom:5, paddingTop:5 }]}>
          <Text style={styles.TextItem}>{item.name}</Text>
          {item.phoneNumbers && item.phoneNumbers.map((phoneNumber, index) =>
            <Text key={index}>{phoneNumber.number}</Text>
          )}
        </Pressable>
      )}
      renderSectionHeader={({ section: { title } }) => (
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeader}>{title}</Text>
        </View>
      )}
    />

  );
}

const styles = StyleSheet.create({
  container: {
    // backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  phoneContact: {
    gap:5,
    backgroundColor:"white",
    borderColor: "#D0D0D0",
    paddingLeft:30,
  },
  TextItem:{
    fontWeight:"bold",
    fontSize: 14,
    color: '#000000',
  },
  sectionHeaderContainer: {
    backgroundColor: '#f8f8f8',
  },
  sectionHeader: {
    marginTop:5,
    marginBottom:5,
    marginLeft:30,
    fontSize: 12,
    color: '#919191',
  },
});
