import { Colors } from '@/constants/constants';
import { createSnippet, getSnippetById, updateSnippet } from '@/db/services/snippets';
import { addTagToSnippet, removeTag } from '@/db/services/tags';
import { useThemeStore } from '@/store/themeStore';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const LANGUAGES = [
    'javascript', 'typescript', 'python', 'java', 'kotlin',
    'swift', 'rust', 'go', 'cpp', 'c', 'csharp', 'php',
    'ruby', 'sql', 'html', 'css', 'bash', 'json', 'yaml', 'plaintext'
]


export default function CreateSnippet() {

    const { id } = useLocalSearchParams()
    const isEditing = !!id
    const router = useRouter()
    const { theme } = useThemeStore()
    const color = Colors[theme]


    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [language, setLanguage] = useState('javascript')
    const [tags, setTags] = useState<{ id?: number, name: string }[]>([])
    const [tagInput, setTagInput] = useState('')



    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [showLanguagePicker, setShowLanguagePicker] = useState(false)


    const tagInputRef = useRef<TextInput>(null)

    const loadSnippet = useCallback(async () => {
        if (!isEditing) return

        try {
            setLoading(true)
            const snippet = await getSnippetById(Number(id))
            if (!snippet) return

            setTitle(snippet.title)
            setContent(snippet.content)
            setLanguage(snippet.language)
            setTags(snippet.snippet_tags?.map((t: any) => ({
                id: t.tag.id,
                name: t.tag.name
            })) ?? [])


        } catch (error) {
            Alert.alert('Failed to fetch snippets')
        }
        finally {
            setLoading(false)
        }
    }, [id, isEditing])

    useEffect(() => {
        loadSnippet()
    }, [loadSnippet])

    const handleAddTag = () => {
        const trimmed = tagInput.trim()
        if (!trimmed) return

        if (tags.find((t) => t.name == trimmed)) {
            setTagInput('')
            return
        }

        setTags(prev => [...prev, { name: trimmed }])
        setTagInput('')
    }

    const handleRemoveTag = async (tagName: string, tagId: number) => {
        setTags(prev => prev.filter((t) => t.name !== tagName))

        if (isEditing && tagId) {
            await removeTag(Number(id), tagId)
        }
    }


    const handleSubmit = async () => {
        if (!title.trim()) {
            Alert.alert('Title cannot be empty')
            return
        }
        if (!content.trim()) {
            Alert.alert('Content cannot be empty')
            return
        }

        try {
            setSaving(true)
            if (isEditing) {

                await updateSnippet(Number(id), {
                    title: title.trim(),
                    content: content.trim(),
                    language
                })

                const newTags = tags.filter((t) => !t.id)
                for (const tag of newTags) {
                    await addTagToSnippet(Number(id), tag.name)
                }

            } else {
                await createSnippet({
                    title: title.trim(),
                    content: content.trim(),
                    language,
                    tags: tags.map((t) => t.name)
                })
            }
            router.back()

        } catch (error) {
            console.log(error);
            Alert.alert('Failed creating snippet')

        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: color.background }]}>
                <ActivityIndicator size="large" color={color.primary} />
            </View>
        )
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: color.background }]} edges={['top']}>

            <View style={[styles.header, { borderBottomColor: color.border }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.headerBtn, { backgroundColor: color.card, borderColor: color.border }]}
                >

                    <Feather name="arrow-left" size={18} color={color.text} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { color: color.text }]}>
                    {isEditing ? 'Edit Snippet' : 'New Snippet'}
                </Text>

                <View style={styles.headerBtn} />
            </View>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: color.text }]}>Title</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: color.card, borderColor: color.border, color: color.text }]}
                            placeholder="e.g. Fetch API Wrapper"
                            placeholderTextColor={color.placeholder}
                            value={title}
                            onChangeText={setTitle}
                            autoCapitalize="words"
                            returnKeyType="next"
                        />
                    </View>


                    <View style={styles.field}>
                        <Text style={[styles.label, { color: color.text }]}>Language</Text>
                        <TouchableOpacity
                            style={[styles.languageSelector, { backgroundColor: color.card, borderColor: color.border }]}
                            onPress={() => setShowLanguagePicker(true)}
                        >
                            <View style={[styles.languageDot, { backgroundColor: color.primary + '20' }]}>
                                <Feather name="code" size={14} color={color.primary} />
                            </View>
                            <Text style={[styles.languageSelectorText, { color: color.text }]}>
                                {language}
                            </Text>
                            <Feather name="chevron-down" size={16} color={color.placeholder} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.field}>

                        <Text style={[styles.label, { color: color.text }]}>Tags</Text>


                        {tags.length > 0 && (
                            <View style={styles.tagsRow}>
                                {tags.map(tag => (
                                    <View
                                        key={tag.name}
                                        style={[styles.tagChip, { backgroundColor: color.primary + '15', borderColor: color.primary + '30' }]}
                                    >
                                        <Text style={[styles.tagChipText, { color: color.primary }]}>#{tag.name}</Text>
                                        <TouchableOpacity
                                            onPress={() => handleRemoveTag(tag.name, Number(tag.id))}
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        >
                                            <Feather name="x" size={12} color={color.primary} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                        <View style={[styles.tagInputRow, { backgroundColor: color.card, borderColor: color.border }]}>
                            <Feather name="tag" size={15} color={color.placeholder} />
                            <TextInput
                                ref={tagInputRef}
                                style={[styles.tagInput, { color: color.text }]}
                                placeholder="Add a tag and press enter"
                                placeholderTextColor={color.placeholder}
                                value={tagInput}
                                onChangeText={setTagInput}
                                onSubmitEditing={handleAddTag}
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="done"
                                blurOnSubmit={false}
                            />
                            {tagInput.length > 0 && (
                                <TouchableOpacity
                                    onPress={handleAddTag}
                                    style={[styles.tagAddBtn, { backgroundColor: color.primary }]}
                                >
                                    <Feather name="plus" size={14} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>


                    <View style={styles.field}>
                        <Text style={[styles.label, { color: color.text }]}>Code</Text>
                        <View style={[styles.codeInputWrapper, { backgroundColor: theme === 'dark' ? '#0E1420' : '#F8FAFC', borderColor: color.border }]}>

                            <View style={[styles.codeEditorHeader, { borderBottomColor: color.border }]}>
                                <View style={styles.codeDotsRow}>
                                    <View style={[styles.codeDot, { backgroundColor: '#FF5F57' }]} />
                                    <View style={[styles.codeDot, { backgroundColor: '#FFBD2E' }]} />
                                    <View style={[styles.codeDot, { backgroundColor: '#28CA41' }]} />
                                </View>
                                <Text style={[styles.codeEditorLabel, { color: color.placeholder }]}>
                                    {language}
                                </Text>
                            </View>
                            <TextInput
                                style={[styles.codeInput, { color: theme === 'dark' ? '#CBD5E1' : '#334155' }]}
                                placeholder="// Paste or type your code here..."
                                placeholderTextColor={color.placeholder}
                                value={content}
                                onChangeText={setContent}
                                multiline
                                autoCapitalize="none"
                                autoCorrect={false}
                                spellCheck={false}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                </ScrollView>


                <View style={[styles.bottomBar, { backgroundColor: color.background, borderTopColor: color.border }]}>
                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: color.primary }, saving && styles.saveBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={saving}
                        activeOpacity={0.8}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Feather name={isEditing ? 'check' : 'save'} size={18} color="#fff" />
                                <Text style={styles.saveBtnText}>
                                    {isEditing ? 'Save Changes' : 'Create Snippet'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
            <Modal
                visible={showLanguagePicker}
                animationType="slide"
                transparent
                onRequestClose={() => setShowLanguagePicker(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowLanguagePicker(false)}
                >
                    <View style={[styles.modalSheet, { backgroundColor: color.background, borderColor: color.border }]}>
                        <View style={[styles.modalHandle, { backgroundColor: color.border }]} />
                        <Text style={[styles.modalTitle, { color: color.text }]}>Select Language</Text>

                        <FlatList
                            data={LANGUAGES}
                            keyExtractor={item => item}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.languageOption,
                                        { borderBottomColor: color.border },
                                        language === item && { backgroundColor: color.primary + '10' }
                                    ]}
                                    onPress={() => {
                                        setLanguage(item)
                                        setShowLanguagePicker(false)
                                    }}
                                >
                                    <Text style={[
                                        styles.languageOptionText,
                                        { color: language === item ? color.primary : color.text }
                                    ]}>
                                        {item}
                                    </Text>
                                    {language === item && (
                                        <Feather name="check" size={16} color={color.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>


        </SafeAreaView>
    )


}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    flex: { flex: 1 },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 12,
    },
    headerBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },

    // Scroll
    scrollContent: {
        padding: 16,
        gap: 20,
        paddingBottom: 20,
    },

    // Fields
    field: { gap: 8 },
    label: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    input: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontSize: 15,
    },

    // Language selector
    languageSelector: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    languageDot: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    languageSelectorText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },

    // Tags
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    tagChipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    tagInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 14,
        gap: 10,
    },
    tagInput: {
        flex: 1,
        fontSize: 15,
    },
    tagAddBtn: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Code editor
    codeInputWrapper: {
        borderRadius: 14,
        borderWidth: 1,
        overflow: 'hidden',
        minHeight: 240,
    },
    codeEditorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    codeDotsRow: {
        flexDirection: 'row',
        gap: 6,
    },
    codeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    codeEditorLabel: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    codeInput: {
        fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
        fontSize: 13,
        lineHeight: 20,
        padding: 14,
        minHeight: 200,
    },

    // Bottom bar
    bottomBar: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        borderTopWidth: 1,
    },
    saveBtn: {
        height: 52,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    saveBtnDisabled: {
        opacity: 0.6,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },

    // Language modal
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalSheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: 1,
        borderBottomWidth: 0,
        paddingTop: 12,
        maxHeight: '60%',
    },
    modalHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
        paddingHorizontal: 16,
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    languageOptionText: {
        fontSize: 15,
        fontWeight: '500',
    },
})