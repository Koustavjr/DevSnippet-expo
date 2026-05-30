import { Colors } from "@/constants/constants";
import { useThemeStore } from "@/store/themeStore";
import Feather from "@expo/vector-icons/Feather";
import { Tabs } from "expo-router";

export default function TabLayout() {

    const { theme } = useThemeStore();
    const color = Colors[theme as keyof typeof Colors];

    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: color.primary,
            tabBarInactiveTintColor: color.text,
            tabBarStyle: {
                backgroundColor: color.background,
                borderTopColor: color.border,
                borderTopWidth: 1,
            }

        }}>
            <Tabs.Screen name="index" options={{
                title: "Snippets", tabBarIcon: ({ color, size }) => (
                    <Feather name="code" size={size} color={color} />
                )
            }} />
            <Tabs.Screen name="favorites" options={{
                title: "Favorites", tabBarIcon: ({ color, size }) => (
                    <Feather name="heart" size={size} color={color} />
                )
            }} />
            <Tabs.Screen name="fileScreen" options={{
                title: "Files", tabBarIcon: ({ color, size }) => (
                    <Feather name="file" size={size} color={color} />
                )
            }} />
            <Tabs.Screen name="settings" options={{
                title: "Settings", tabBarIcon: ({ color, size }) => (
                    <Feather name="settings" size={size} color={color} />
                )
            }} />

        </Tabs>
    )
}