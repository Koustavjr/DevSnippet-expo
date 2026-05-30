import { snippets as schemaSnippets } from '@/db/Schema'
import { getFavorites } from '@/db/services/snippets'
import { Inter_400Regular_Italic, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter'
import Feather from '@expo/vector-icons/Feather'
import { type InferSelectModel } from 'drizzle-orm'
import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '../../constants/constants'
import { useThemeStore } from '../../store/themeStore'

type fav = InferSelectModel<typeof schemaSnippets>;
const testData = [
    {
        id: 1,
        title: "Fetch API Wrapper",
        content: "const fetchData = async (url) => {\n  const res = await fetch(url);\n  return res.json();\n};",
        language: "javascript",
        is_favorite: true,
        created_at: new Date(),
        updated_at: new Date(),
    },
    {
        id: 2,
        title: "Quick Sort Algorithm",
        content: "def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]",
        language: "python",
        is_favorite: false,
        created_at: new Date(),
        updated_at: new Date(),
    },
    {
        id: 3,
        title: "Drizzle Schema Join Query",
        content: "SELECT s.title, t.name\nFROM snippets s\nINNER JOIN snippet_tags st ON s.id = st.snippet_id\nINNER JOIN tags t ON t.id = st.tag_id;",
        language: "sql",
        is_favorite: true,
        created_at: new Date(),
        updated_at: new Date(),
    }
]

const Favorites = () => {
    const [fontsLoaded] = useFonts({
        Inter_600SemiBold,
        Inter_400Regular_Italic
    })

    const router = useRouter()
    const [favorites, setFavorites] = useState<fav[]>([])
    const { theme } = useThemeStore();
    const color = Colors[theme as keyof typeof Colors];


    // if (!fontsLoaded) {
    //     return null; // Or show a loading spinner
    // }


    const fetchFav = async () => {
        try {
            const res = await getFavorites();
            if (res && res.length > 0) {

                setFavorites(res);
            }
        } catch (error) {
            console.log(error)
        }
    }

    useFocusEffect(
        useCallback(() => {
            fetchFav();
        }, [])
    );

    const [searchQuery, setSearchQuery] = useState<string>('');

    const filteredFavorites = useMemo(() => {
        if (!searchQuery.trim()) return favorites;
        const query = searchQuery.toLowerCase();
        return favorites.filter(
            s =>
                s.title.toLowerCase().includes(query) ||
                (s.language && s.language.toLowerCase().includes(query)) ||
                (s.content && s.content.toLowerCase().includes(query))
        );
    }, [searchQuery, favorites]);

    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconWrapper, { backgroundColor: color.card, borderColor: color.border }]}>
                <Feather name="code" size={32} color={color.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: color.text }]}>No Snippets Found</Text>
            <Text style={[styles.emptySubtitle, { color: color.placeholder }]}>
                {searchQuery ? "Try refining your search terms" : "Get started by adding your first code snippet!"}
            </Text>

        </View>
    );



    return (
        <SafeAreaView style={styles.safeAreaView}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <Feather name="codesandbox" size={44} color={color.primary} />
                <Text style={[styles.heading, { color: color.primary }]}>Favorites</Text>
            </View>

            <View style={[styles.searchWrapper, { backgroundColor: color.card, borderColor: color.border }]}>
                <Feather name="search" size={18} color={color.placeholder} style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchInput, { color: color.text }]}
                    placeholder="Search favorites..."
                    placeholderTextColor={color.placeholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCorrect={false}
                    autoCapitalize="none"
                />
                {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Feather name="x-circle" size={18} color={color.placeholder} />
                    </TouchableOpacity>
                ) : null}
            </View>
            <View style={styles.listContainer}>

                <FlatList
                    data={filteredFavorites}
                    showsVerticalScrollIndicator={false}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyComponent}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.card, { backgroundColor: color.card, borderColor: color.border }]}
                            onPress={() => router.push(`/snippet/${item.id}`)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.cardHeader}>
                                <Text style={[styles.cardTitle, { color: color.text }]} numberOfLines={1}>
                                    {item.title || 'Untitled Snippet'}
                                </Text>

                            </View>

                            {item.content ? (
                                <View style={[styles.codePreview, { backgroundColor: theme === 'dark' ? '#0E1420' : '#F8FAFC', borderColor: color.border }]}>
                                    <Text
                                        style={[styles.codeText, { color: theme === 'dark' ? '#CBD5E1' : '#475569' }]}
                                        numberOfLines={3}
                                    >
                                        {item.content}
                                    </Text>
                                </View>
                            ) : null}

                            <View style={styles.cardFooter}>
                                <View style={[styles.badge, { backgroundColor: color.primary + '15' }]}>
                                    <Feather name="code" size={12} color={color.primary} style={styles.badgeIcon} />
                                    <Text style={[styles.badgeText, { color: color.primary }]}>
                                        {item.language || 'plaintext'}
                                    </Text>
                                </View>
                                <View style={styles.dateWrapper}>
                                    <Feather name="calendar" size={11} color={color.placeholder} style={styles.dateIcon} />
                                    <Text style={[styles.dateText, { color: color.placeholder }]}>
                                        {new Date(item.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                    )}
                />

            </View>
        </SafeAreaView>
    )
}

export default Favorites

const styles = StyleSheet.create({
    safeAreaView: {
        flex: 1
    }
    ,
    heading: {
        flex: 1,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 44,
        fontWeight: '500',
        letterSpacing: 0.5,
        fontFamily: "Inter_400Regular_Italic"

    },
    listContent: {
        paddingBottom: 24,
    },

    searchWrapper: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 16,
        marginTop: 4,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === "android" ? 10 : 14,
        borderRadius: 14,
        borderWidth: 1,
    },

    searchIcon: {
        marginRight: 8,
    },

    searchInput: {
        flex: 1,
        fontSize: 15,
        fontFamily: "Inter_500Regular",
    },
    listContainer: {

        flex: 1,
        marginHorizontal: 16,
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 80,
        paddingHorizontal: 20,
    },
    emptyIconWrapper: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        borderWidth: 1,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 4,
        fontFamily: "Inter_500Medium",
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: "center",
        marginBottom: 24,
        fontFamily: "Inter_400Regular",
        lineHeight: 21,
    },
    emptyButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },
    emptyButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
        fontFamily: "Inter_600SemiBold",
    },

    card: {
        marginVertical: 8,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: "600",
        letterSpacing: 0.2,
        fontFamily: "Inter_600SemiBold",
        color: "white",
        marginRight: 8,
    },
    codePreview: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
        overflow: "hidden",
        fontFamily: "Inter_600SemiBold",
    },
    codeText: {
        fontSize: 14,
        fontFamily: "Inter_400Regular",
        lineHeight: 20,
    },
    cardFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
    },
    badgeIcon: {
        marginRight: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "600",
        fontFamily: "Inter_600SemiBold",
    },
    dateWrapper: {
        flexDirection: "row",
        alignItems: "center",
    },
    dateIcon: {
        marginRight: 4,
    },
    dateText: {
        fontSize: 12,
        fontFamily: "Inter_400Regular",
    }

})