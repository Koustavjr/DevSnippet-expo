import { eq, like, or } from "drizzle-orm"
import { db } from "../client"
import { snippet_tags, snippets, tags } from "../Schema"

type snippetsInput = {
    title: string,
    content: string,
    language: string,
    tags: string[]
}


export const createSnippet = async (input: snippetsInput) => {

    await db.transaction(async (tx) => {
        const res = await tx.insert(snippets)
            .values({
                title: input.title,
                content: input.content,
                language: input.language,
                created_at: new Date(),
                updated_at: new Date(),
                is_favorite: false,
            }).returning()
        const newSnippet = res[0]

        for (const tag of input.tags) {

            let existingTags = await tx.select().from(tags).where(eq(tags.name, tag)).get()

            if (!existingTags) {
                const resTag = await tx.insert(tags).values({
                    name: tag,
                }).returning()

                existingTags = resTag[0]
            }

            await tx.insert(snippet_tags).values({
                snippet_id: newSnippet.id,
                tag_id: existingTags?.id
            })

        }
        return newSnippet;
    })

}


export const getSnippets = async () => {
    return await db.select().from(snippets)
}


export const getSnippetById = async (id: number) => {
    return await db.query.snippets.findFirst({
        where: eq(snippets.id, id),
        with: {
            snippet_tags: {
                with: {
                    tag: true
                }
            }
        }
    })
}

type snippetUpdateInput = Omit<snippetsInput, 'tags'> & {
    tags?: string[]
}

export const updateSnippet = async (id: number, input: snippetUpdateInput) => {
    await db.update(snippets).set({
        title: input.title,
        content: input.content,
        language: input.language,
        updated_at: new Date(),
    }).where(eq(snippets.id, id))
}

export const deleteSnippet = async (id: number) => {
    await db.delete(snippets).where(eq(snippets.id, id))
}
export const toggleFavorite = async (id: number) => {
    const snippet = await db
        .select()
        .from(snippets)
        .where(eq(snippets.id, id))
        .get()

    if (!snippet) return

    await db
        .update(snippets)
        .set({
            is_favorite: !snippet.is_favorite,
            updated_at: new Date()
        })
        .where(eq(snippets.id, id))
}


export const searchSnippets = async (query: string) => {
    return await db.query.snippets.findMany({
        where: or(
            like(snippets.title, `%${query}%`),
            like(snippets.content, `%${query}%`),
            like(snippets.language, `%${query}%`),
        ),
        with: {
            snippet_tags: {
                with: {
                    tag: true
                }
            }
        }
    })

}


export const getFavorites = async () => {
    return await db.query.snippets.findMany({
        where: eq(snippets.is_favorite, true),
        with: {
            snippet_tags: { with: { tag: true } }
        }
    })
}