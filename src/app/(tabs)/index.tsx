import { Colors } from '@/constants/constants';
import { snippets as schemaSnippets } from '@/db/Schema';
import { getSnippets, toggleFavorite } from '@/db/services/snippets';
import Feather from '@expo/vector-icons/Feather';
import { type InferSelectModel } from 'drizzle-orm';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';


export type Snippet = InferSelectModel<typeof schemaSnippets>;

export default function Index() {
  const router = useRouter();
  const { theme, toggleTheme } = useThemeStore();
  const color = Colors[theme as keyof typeof Colors];

  const [snippets, setSnippets] = useState<Snippet[]>([
    // {
    //   id: 1,
    //   title: "Fetch API Wrapper",
    //   content: "const fetchData = async (url) => {\n  const res = await fetch(url);\n  return res.json();\n};",
    //   language: "javascript",
    //   is_favorite: true,
    //   created_at: new Date(),
    //   updated_at: new Date(),
    // },
    // {
    //   id: 2,
    //   title: "Quick Sort Algorithm",
    //   content: "def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]",
    //   language: "python",
    //   is_favorite: false,
    //   created_at: new Date(),
    //   updated_at: new Date(),
    // },
    // {
    //   id: 3,
    //   title: "Drizzle Schema Join Query",
    //   content: "SELECT s.title, t.name\nFROM snippets s\nINNER JOIN snippet_tags st ON s.id = st.snippet_id\nINNER JOIN tags t ON t.id = st.tag_id;",
    //   language: "sql",
    //   is_favorite: true,
    //   created_at: new Date(),
    //   updated_at: new Date(),
    // }
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchSnippets = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await getSnippets();
      if (res && res.length > 0) {
        setSnippets(res);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch snippets");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSnippets(snippets.length === 0);
    }, [])
  );

  const handleToggleFavorite = async (id: number) => {
    try {

      setSnippets(prev =>
        prev.map(s => (s.id === id ? { ...s, is_favorite: !s.is_favorite } : s))
      );
      await toggleFavorite(id);
    } catch (error) {
      Alert.alert("Error", "Failed to update favorite");

      setSnippets(prev =>
        prev.map(s => (s.id === id ? { ...s, is_favorite: !s.is_favorite } : s))
      );
    }
  };

  const filteredSnippets = useMemo(() => {
    if (!searchQuery.trim()) return snippets;
    const query = searchQuery.toLowerCase();
    return snippets.filter(
      s =>
        s.title.toLowerCase().includes(query) ||
        (s.language && s.language.toLowerCase().includes(query)) ||
        (s.content && s.content.toLowerCase().includes(query))
    );
  }, [searchQuery, snippets]);

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconWrapper, { backgroundColor: color.card, borderColor: color.border }]}>
        <Feather name="code" size={32} color={color.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: color.text }]}>No Snippets Found</Text>
      <Text style={[styles.emptySubtitle, { color: color.placeholder }]}>
        {searchQuery ? "Try refining your search terms" : "Get started by adding your first code snippet!"}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={[styles.emptyButton, { backgroundColor: color.primary }]}
          onPress={() => router.push('/snippet/create')}
        >
          <Text style={styles.emptyButtonText}>Add Snippet</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: color.background }]} edges={['top']}>

      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={[styles.logoIconWrapper, { backgroundColor: color.primary + '15', borderColor: color.primary + '30' }]}>
            <Feather name="terminal" size={20} color={color.primary} />
          </View>
          <View>
            <Text style={[styles.headerSubtitle, { color: color.placeholder }]}>Welcome to</Text>
            <Text style={[styles.logoText, { color: color.primary }]}>
              Snip<Text style={{ color: color.text, fontWeight: '300' }}>Vault</Text>
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.themeButton, { backgroundColor: color.card, borderColor: color.border }]}
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
          <Feather name={theme === 'dark' ? 'sun' : 'moon'} size={20} color={color.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchWrapper, { backgroundColor: color.card, borderColor: color.border }]}>
        <Feather name="search" size={18} color={color.placeholder} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: color.text }]}
          placeholder="Search snippets..."
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


      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color={color.primary} size="large" />
        </View>
      ) : (
        <View style={styles.listContainer}>
          <FlatList
            data={filteredSnippets}
            keyExtractor={item => item.id.toString()}
            ListEmptyComponent={renderEmptyComponent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
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
                  <TouchableOpacity
                    onPress={() => handleToggleFavorite(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather
                      name="star"
                      size={18}
                      color={item.is_favorite ? "#F59E0B" : color.placeholder}
                      fill={item.is_favorite ? "#F59E0B" : "transparent"}
                    />
                  </TouchableOpacity>
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
      )}


      <TouchableOpacity
        style={[styles.fab, { backgroundColor: color.primary }]}
        onPress={() => router.push('/snippet/create')}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 1,
  },
  logoText: {
    fontSize: 22,
    fontFamily: Platform.select({
      ios: 'Gill Sans',
      android: 'sans-serif-medium',
      default: 'System',
    }),
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  themeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // extra padding for FAB
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  codePreview: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  codeText: {
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
    fontSize: 12,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 4,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
