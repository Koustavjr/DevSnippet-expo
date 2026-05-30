import { db } from "@/db/client";
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from "expo-router";
import { Text, View } from "react-native";
import migrations from '../../drizzle/migrations';

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "red", fontSize: 16 }}>
          Migration Error: {error.message}
        </Text>
      </View>
    )
  }

  if (!success) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Loading...</Text>
      </View>
    )
  }

  return <Stack
    screenOptions={{
      headerShown: false,
      statusBarStyle: 'dark',
      statusBarTranslucent: true
    }}
  >

    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="snippet/[id]" options={{ headerShown: false }} />
    <Stack.Screen name="snippet/create" options={{ headerShown: false }} />
  </Stack>
}